import type {
  AIResponseFormat,
  CodeBlock,
  UnifiedDiff,
  SearchReplace,
  JSONEdit,
  ParsedAIResponse,
  ParseOptions,
} from './types';
import { AIResponseFormat as Format } from './types';

export function parseAIResponse(response: string, options: ParseOptions = {}): ParsedAIResponse {
  const { autoDetect = true, removeEmptyBlocks = true, isFileCreation = false } = options;

  const format =
    options.expectedFormat || (autoDetect ? detectFormat(response) : Format.PLAIN_TEXT);

  const codeBlocks = extractCodeBlocks(response, removeEmptyBlocks, isFileCreation);
  const unifiedDiffs = extractUnifiedDiffs(response);
  const searchReplaces = extractSearchReplaces(response);
  const jsonEdits = extractJSONEdits(response);
  const textMessages = extractTextMessages(response, codeBlocks);
  const plainText = format === Format.PLAIN_TEXT ? response.trim() : undefined;

  return {
    format,
    codeBlocks,
    unifiedDiffs,
    searchReplaces,
    jsonEdits,
    plainText,
    rawResponse: response,
    textMessages,
  };
}

export function detectFormat(response: string): AIResponseFormat {
  if (response.includes('@@') && /^diff --git/.test(response)) {
    return Format.UNIFIED_DIFF;
  }

  if (response.includes('SEARCH:') && response.includes('REPLACE:')) {
    return Format.SEARCH_REPLACE;
  }

  if (isValidJSON(response)) {
    const parsed = JSON.parse(response);
    if (parsed.operation && parsed.filepath) {
      return Format.JSON_EDIT;
    }
  }

  const codeBlockMatches = response.match(/```/g);
  if (codeBlockMatches) {
    if (codeBlockMatches.length >= 4) {
      return Format.MULTIPLE_CODE_BLOCKS;
    }
    if (codeBlockMatches.length >= 2) {
      return Format.CODE_BLOCK;
    }
  }

  return Format.PLAIN_TEXT;
}

function validateAndSanitizeCodeContent(content: string, skipValidation = false): string {
  if (skipValidation) {
    return content;
  }

  const problematicPatterns = [
    /\/\/\s*\.\.\..*(?:existing|rest|remaining|previous|other|more).*code.*/gi,
    /\/\*\s*\.\.\..*(?:existing|rest|remaining|previous|other|more).*code.*\*\//gi,
    /<!--\s*\.\.\..*(?:existing|rest|remaining|previous|other|more).*code.*-->/gi,
    /#\s*\.\.\..*(?:existing|rest|remaining|previous|other|more).*code.*/gi,

    /\/\/\s*(?:rest|remainder).*(?:of|the).*code.*(?:remains|stays|is).*(?:same|unchanged|as before).*/gi,
    /\/\*\s*(?:rest|remainder).*(?:of|the).*code.*(?:remains|stays|is).*(?:same|unchanged|as before).*\*\//gi,
    /<!--\s*(?:rest|remainder).*(?:of|the).*code.*(?:remains|stays|is).*(?:same|unchanged|as before).*-->/gi,
    /#\s*(?:rest|remainder).*(?:of|the).*code.*(?:remains|stays|is).*(?:same|unchanged|as before).*/gi,

    /\/\/\s*\[.*(?:existing|rest|omitted|unchanged|more|other).*\]/gi,
    /\/\*\s*\[.*(?:existing|rest|omitted|unchanged|more|other).*\]\*\//gi,

    /\/\/\s*\.\.\.+\s*$/gm,
    /\/\*\s*\.\.\.+\s*\*\//gm,
    /^\s*\.\.\.+\s*$/gm,

    /\/\/\s*(?:code\s+)?(?:not\s+shown|omitted|hidden|truncated).*/gi,
    /\/\*\s*(?:code\s+)?(?:not\s+shown|omitted|hidden|truncated).*\*\//gi,

    /\/\/\s*(?:code\s+)?(?:unchanged|remains|same|as before|no changes).*/gi,
    /\/\*\s*(?:code\s+)?(?:unchanged|remains|same|as before|no changes).*\*\//gi,
    /#\s*(?:code\s+)?(?:unchanged|remains|same|as before|no changes).*/gi,

    /\/\/\s*(?:rest|remaining|other).*implementation.*/gi,
    /\/\*\s*(?:rest|remaining|other).*implementation.*\*\//gi,
  ];

  for (const pattern of problematicPatterns) {
    const match = content.match(pattern);
    if (match) {
      throw new Error(
        `❌ INVALID CODE DETECTED - This will break the file!\n\n` +
          `Found placeholder marker:\n` +
          `"${match[0].trim()}"\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🚨 THE PROBLEM:\n` +
          `This marker will be written LITERALLY into the file and BREAK it.\n` +
          `The system CANNOT guess what code you meant to include.\n\n` +
          `🔧 SOLUTIONS:\n` +
          `For EDITS (/edit command), you MUST use one of these formats:\n\n` +
          `1️⃣ SEARCH/REPLACE (recommended):\n` +
          `   SEARCH:\n` +
          `   [exact code to find with context]\n` +
          `   \n` +
          `   REPLACE:\n` +
          `   [exact code to replace it with]\n\n` +
          `2️⃣ UNIFIED DIFF:\n` +
          `   diff --git a/file.ts b/file.ts\n` +
          `   @@ -1,3 +1,3 @@\n` +
          `   -old line\n` +
          `   +new line\n\n` +
          `3️⃣ COMPLETE FILE (only if rewriting entire file):\n` +
          `   \`\`\`filepath:path/to/file.ts\n` +
          `   [EVERY SINGLE LINE OF THE FILE]\n` +
          `   \`\`\`\n\n` +
          `❌ NEVER use partial code with placeholders like:\n` +
          `   - "...rest of the code..."\n` +
          `   - "...existing code..."\n` +
          `   - "// unchanged"\n` +
          `   - "..."\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      );
    }
  }

  return content;
}

export function extractCodeBlocks(
  response: string,
  removeEmpty = true,
  skipValidation = false
): CodeBlock[] {
  const blocks: CodeBlock[] = [];

  const codeBlockRegex = /```([^\n]*)\n([\s\S]*?)```/g;

  let match;
  let index = 0;

  while ((match = codeBlockRegex.exec(response)) !== null) {
    const metadata = match[1].trim();
    let content = match[2];

    if (removeEmpty && !content.trim()) {
      continue;
    }

    try {
      content = validateAndSanitizeCodeContent(content, skipValidation);
    } catch (error) {
      console.error('Error validating code content:', error);
      throw error;
    }

    const { language, filepath, range } = parseCodeBlockMetadata(metadata);

    blocks.push({
      language,
      filepath,
      range,
      content: content,
      index: index++,
    });
  }

  return blocks;
}

function parseCodeBlockMetadata(metadata: string): {
  language?: string;
  filepath?: string;
  range?: { start: number; end: number };
} {
  if (!metadata) {
    return {};
  }

  const result: ReturnType<typeof parseCodeBlockMetadata> = {};

  const filepathMatch = metadata.match(/filepath:(\S+)/);
  if (filepathMatch) {
    result.filepath = filepathMatch[1];

    const ext = result.filepath.split('.').pop()?.toLowerCase();
    if (ext) {
      result.language = ext;
    }
    return result;
  }

  const parts = metadata.split(/\s+/);

  const rangeMatch = metadata.match(/\((\d+)-(\d+)\)/);
  if (rangeMatch) {
    result.range = {
      start: parseInt(rangeMatch[1]),
      end: parseInt(rangeMatch[2]),
    };
  }

  if (parts[0]) {
    if (parts[0].includes('.')) {
      result.filepath = parts[0];
    } else {
      result.language = parts[0];
    }
  }

  if (parts[1] && !result.filepath) {
    result.filepath = parts[1].replace(/\s*\(\d+-\d+\)/, '');
  }

  return result;
}

export function extractUnifiedDiffs(response: string): UnifiedDiff[] {
  const diffs: UnifiedDiff[] = [];

  const diffSections = response.split(/^diff --git /m);

  for (const section of diffSections.slice(1)) {
    const lines = section.split('\n');

    const headerMatch = lines[0].match(/a\/(.+?)\s+b\/(.+)/);
    if (!headerMatch) continue;

    const filepath = headerMatch[1];
    const hunks = parseHunks(lines.slice(1));

    if (hunks.length > 0) {
      diffs.push({ filepath, hunks });
    }
  }

  return diffs;
}

function parseHunks(lines: string[]) {
  const hunks: UnifiedDiff['hunks'] = [];
  let currentHunk: UnifiedDiff['hunks'][0] | null = null;
  let oldLineNumber = 0;
  let newLineNumber = 0;

  for (const line of lines) {
    const hunkMatch = line.match(/^@@\s+-(\d+),(\d+)\s+\+(\d+),(\d+)\s+@@/);
    if (hunkMatch) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }

      currentHunk = {
        oldStart: parseInt(hunkMatch[1]),
        oldLines: parseInt(hunkMatch[2]),
        newStart: parseInt(hunkMatch[3]),
        newLines: parseInt(hunkMatch[4]),
        lines: [],
      };

      oldLineNumber = currentHunk.oldStart;
      newLineNumber = currentHunk.newStart;
      continue;
    }

    if (!currentHunk) continue;

    if (line.startsWith('+')) {
      currentHunk.lines.push({
        type: 'add',
        content: line.slice(1),
        newLineNumber: newLineNumber++,
      });
    } else if (line.startsWith('-')) {
      currentHunk.lines.push({
        type: 'remove',
        content: line.slice(1),
        oldLineNumber: oldLineNumber++,
      });
    } else if (line.startsWith(' ')) {
      currentHunk.lines.push({
        type: 'context',
        content: line.slice(1),
        oldLineNumber: oldLineNumber++,
        newLineNumber: newLineNumber++,
      });
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
}

export function extractSearchReplaces(response: string): SearchReplace[] {
  const searchReplaces: SearchReplace[] = [];

  const searchReplaceRegex =
    /SEARCH:\s*\n([\s\S]*?)\n\s*REPLACE:\s*\n([\s\S]*?)(?=\n\n|SEARCH:|$)/gi;

  let match;
  while ((match = searchReplaceRegex.exec(response)) !== null) {
    searchReplaces.push({
      search: match[1].trim(),
      replace: match[2].trim(),
    });
  }

  return searchReplaces;
}

export function extractJSONEdits(response: string): JSONEdit[] {
  const edits: JSONEdit[] = [];

  if (isValidJSON(response)) {
    const parsed = JSON.parse(response);

    if (parsed.operation && parsed.filepath) {
      edits.push(parsed as JSONEdit);
    }

    if (Array.isArray(parsed)) {
      edits.push(...parsed.filter((item: any) => item.operation && item.filepath));
    }
  }

  const jsonBlocks = extractCodeBlocks(response, true).filter(
    (block) => block.language === 'json' || block.language === 'jsonc'
  );

  for (const block of jsonBlocks) {
    if (isValidJSON(block.content)) {
      const parsed = JSON.parse(block.content);
      if (parsed.operation && parsed.filepath) {
        edits.push(parsed as JSONEdit);
      }
      if (Array.isArray(parsed)) {
        edits.push(...parsed.filter((item: any) => item.operation && item.filepath));
      }
    }
  }

  return edits;
}

export function extractTextMessages(response: string, _codeBlocks: CodeBlock[]): string[] {
  let text = response;

  text = text.replace(/```[\s\S]*?```/g, '');

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const paragraphs: string[] = [];
  let currentParagraph = '';

  for (const line of lines) {
    if (line.length === 0) {
      if (currentParagraph) {
        paragraphs.push(currentParagraph);
        currentParagraph = '';
      }
    } else {
      currentParagraph += (currentParagraph ? ' ' : '') + line;
    }
  }

  if (currentParagraph) {
    paragraphs.push(currentParagraph);
  }

  return paragraphs;
}

function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export function extractFilepathFromContext(
  codeBlock: CodeBlock,
  context?: string
): string | undefined {
  if (codeBlock.filepath) {
    return codeBlock.filepath;
  }

  if (context) {
    const filepathMatch = context.match(/(?:file|path|filepath):\s*([^\s\n]+)/i);
    if (filepathMatch) {
      return filepathMatch[1];
    }
  }

  return undefined;
}
