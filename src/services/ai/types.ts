export const AIResponseFormat = {
  CODE_BLOCK: 'CODE_BLOCK',

  UNIFIED_DIFF: 'UNIFIED_DIFF',

  SEARCH_REPLACE: 'SEARCH_REPLACE',

  JSON_EDIT: 'JSON_EDIT',

  PLAIN_TEXT: 'PLAIN_TEXT',

  MULTIPLE_CODE_BLOCKS: 'MULTIPLE_CODE_BLOCKS',
} as const;

export type AIResponseFormat = (typeof AIResponseFormat)[keyof typeof AIResponseFormat];

export interface CodeBlock {
  language?: string;

  filepath?: string;

  range?: { start: number; end: number };

  content: string;

  index: number;
}

export interface UnifiedDiff {
  filepath: string;

  hunks: DiffHunk[];
}

export interface DiffHunk {
  oldStart: number;

  oldLines: number;

  newStart: number;

  newLines: number;

  lines: DiffLine[];
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context';

  content: string;

  oldLineNumber?: number;

  newLineNumber?: number;
}

export interface SearchReplace {
  filepath?: string;

  search: string;

  replace: string;
}

export interface JSONEdit {
  filepath: string;

  operation: 'create' | 'update' | 'delete';

  content?: string;

  range?: { start: number; end: number };
}

export interface ParsedAIResponse {
  format: AIResponseFormat;

  codeBlocks: CodeBlock[];

  unifiedDiffs: UnifiedDiff[];

  searchReplaces: SearchReplace[];

  jsonEdits: JSONEdit[];

  plainText?: string;

  rawResponse: string;

  textMessages: string[];
}

export interface ParseOptions {
  autoDetect?: boolean;

  expectedFormat?: AIResponseFormat;

  extractAllCodeBlocks?: boolean;

  removeEmptyBlocks?: boolean;

  validateFilepaths?: boolean;

  isFileCreation?: boolean;
}
