import type { CodeBlock } from './types';

export function extractContentFromCodeBlock(
  response: string,
  filepath: string
): string | undefined {
  const escapedPath = filepath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const filepathFormatRegex = new RegExp(
    `\`\`\`\\s*filepath:${escapedPath}\\s*\\n([\\s\\S]*?)\\n\`\`\``,
    'm'
  );

  let match = response.match(filepathFormatRegex);
  if (match && match[1]) {
    return match[1];
  }

  const regex = new RegExp(
    `\`\`\`[^\\n]*\\b${escapedPath}(?:\\s+\\([\\d-]+\\))?[^\\n]*\\n([\\s\\S]*?)\\n\`\`\``,
    'm'
  );

  match = response.match(regex);
  if (match && match[1]) {
    return match[1];
  }

  return undefined;
}

export function extractPathsFromCodeBlocks(response: string): string[] {
  const paths: string[] = [];

  const codeBlockStarts = response.match(/```[^\n]+/g) || [];

  for (const blockStart of codeBlockStarts) {
    const filepathMatch = blockStart.match(/```\s*filepath:([^\s]+)/);
    if (filepathMatch && filepathMatch[1]) {
      const filepath = filepathMatch[1];
      if (!paths.includes(filepath)) {
        paths.push(filepath);
      }
      continue;
    }

    const filenameMatches = blockStart.match(/([^\s()```]+\.[a-zA-Z0-9]+)/);

    if (filenameMatches && filenameMatches[1]) {
      const filename = filenameMatches[1];

      if (
        /\.[a-zA-Z0-9]+$/.test(filename) &&
        !filename.includes('://') &&
        !paths.includes(filename)
      ) {
        paths.push(filename);
      }
    }
  }

  return paths;
}

export function extractCodeBlocksByPath(response: string): Map<string, string> {
  const blocksByPath = new Map<string, string>();
  const paths = extractPathsFromCodeBlocks(response);

  for (const path of paths) {
    const content = extractContentFromCodeBlock(response, path);
    if (content) {
      blocksByPath.set(path, content);
    }
  }

  return blocksByPath;
}

export function filterCodeBlocksByLanguage(blocks: CodeBlock[], language: string): CodeBlock[] {
  return blocks.filter((block) => block.language?.toLowerCase() === language.toLowerCase());
}

export function removeCodeFences(content: string): string {
  content = content.replace(/^```[^\n]*\n/m, '');

  content = content.replace(/\n```\s*$/m, '');

  return content.trim();
}

export function detectLanguageFromPath(filepath: string): string | undefined {
  const extension = filepath.split('.').pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    sh: 'bash',
    bash: 'bash',
    yaml: 'yaml',
    yml: 'yaml',
    json: 'json',
    md: 'markdown',
    sql: 'sql',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
  };

  return extension ? languageMap[extension] : undefined;
}

export function formatCodeBlock(content: string, filepath?: string, language?: string): string {
  const lang = language || (filepath ? detectLanguageFromPath(filepath) : '') || '';
  const metadata = filepath ? `${lang} ${filepath}` : lang;

  return `\`\`\`${metadata}\n${content}\n\`\`\``;
}

export function removeCodeBlocksFromText(response: string): string {
  const codeBlockRegex = /```[\s\S]*?```/g;
  return response.replace(codeBlockRegex, '').trim();
}

export function splitIntoSections(response: string): Array<{
  type: 'text' | 'code';
  content: string;
  codeBlock?: CodeBlock;
}> {
  const sections: ReturnType<typeof splitIntoSections> = [];
  const codeBlockRegex = /```([^\n]*)\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;
  let blockIndex = 0;

  while ((match = codeBlockRegex.exec(response)) !== null) {
    const textBefore = response.slice(lastIndex, match.index);
    if (textBefore.trim()) {
      sections.push({
        type: 'text',
        content: textBefore.trim(),
      });
    }

    const metadata = match[1].trim();
    const content = match[2];
    const { language, filepath, range } = parseCodeBlockMetadata(metadata);

    sections.push({
      type: 'code',
      content: match[0],
      codeBlock: {
        language,
        filepath,
        range,
        content,
        index: blockIndex++,
      },
    });

    lastIndex = match.index + match[0].length;
  }

  const textAfter = response.slice(lastIndex);
  if (textAfter.trim()) {
    sections.push({
      type: 'text',
      content: textAfter.trim(),
    });
  }

  return sections;
}

function parseCodeBlockMetadata(metadata: string): {
  language?: string;
  filepath?: string;
  range?: { start: number; end: number };
} {
  if (!metadata) {
    return {};
  }

  const parts = metadata.split(/\s+/);
  const result: ReturnType<typeof parseCodeBlockMetadata> = {};

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
