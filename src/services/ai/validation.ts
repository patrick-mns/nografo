import type { ParsedAIResponse, CodeBlock, UnifiedDiff, SearchReplace } from './types';
import type { FileOperations } from './applier';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'file_not_found' | 'content_mismatch' | 'invalid_path' | 'dangerous_operation';
  message: string;
  filepath?: string;
  details?: string;
}

export interface ValidationWarning {
  type: 'new_file' | 'large_change' | 'suspicious_content';
  message: string;
  filepath?: string;
}

export interface ValidationOptions {
  allowNewFiles?: boolean;

  maxLinesChanged?: number;

  maxChangePercentage?: number;

  forbiddenPatterns?: RegExp[];

  strictContentMatch?: boolean;
}

const DEFAULT_OPTIONS: ValidationOptions = {
  allowNewFiles: false,
  maxLinesChanged: 500,
  maxChangePercentage: 0.8,
  strictContentMatch: true,
  forbiddenPatterns: [/node_modules/, /\.git/, /dist/, /build/],
};

export async function validateAIResponse(
  parsed: ParsedAIResponse,
  fileOps: FileOperations,
  options: ValidationOptions = {}
): Promise<ValidationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const block of parsed.codeBlocks) {
    const result = await validateCodeBlock(block, fileOps, opts);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  for (const diff of parsed.unifiedDiffs) {
    const result = await validateUnifiedDiff(diff, fileOps, opts);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  for (const sr of parsed.searchReplaces) {
    const result = await validateSearchReplace(sr, fileOps, opts);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

async function validateCodeBlock(
  block: CodeBlock,
  fileOps: FileOperations,
  options: ValidationOptions
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!block.filepath) {
    return { valid: true, errors, warnings };
  }

  if (options.forbiddenPatterns?.some((pattern) => pattern.test(block.filepath!))) {
    errors.push({
      type: 'invalid_path',
      message: `Caminho proibido: ${block.filepath}`,
      filepath: block.filepath,
    });
  }

  const exists = await fileOps.fileExists(block.filepath);

  if (!exists && !options.allowNewFiles) {
    errors.push({
      type: 'file_not_found',
      message: `File does not exist in project: ${block.filepath}`,
      filepath: block.filepath,
      details:
        'The AI may be trying to modify a file from a different context. Reject this change.',
    });
  } else if (!exists) {
    warnings.push({
      type: 'new_file',
      message: `New file will be created: ${block.filepath}`,
      filepath: block.filepath,
    });
  }

  if (exists) {
    try {
      const currentContent = await fileOps.readFile(block.filepath);
      const changeStats = calculateChangeStats(currentContent, block.content);

      if (changeStats.linesChanged > (options.maxLinesChanged || 500)) {
        warnings.push({
          type: 'large_change',
          message: `Very large change: ${changeStats.linesChanged} lines in ${block.filepath}`,
          filepath: block.filepath,
        });
      }

      if (changeStats.changePercentage > (options.maxChangePercentage || 0.8)) {
        warnings.push({
          type: 'large_change',
          message: `Change of ${Math.round(changeStats.changePercentage * 100)}% in file ${block.filepath}`,
          filepath: block.filepath,
        });
      }
    } catch (error) {}
  }

  return { valid: errors.length === 0, errors, warnings };
}

async function validateUnifiedDiff(
  diff: UnifiedDiff,
  fileOps: FileOperations,
  options: ValidationOptions
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const exists = await fileOps.fileExists(diff.filepath);

  if (!exists) {
    errors.push({
      type: 'file_not_found',
      message: `File does not exist: ${diff.filepath}`,
      filepath: diff.filepath,
      details: 'Diff cannot be applied to non-existent file',
    });
    return { valid: false, errors, warnings };
  }

  if (options.strictContentMatch) {
    try {
      const currentContent = await fileOps.readFile(diff.filepath);
      const lines = currentContent.split('\n');

      for (const hunk of diff.hunks) {
        const canApply = verifyHunkCanBeApplied(lines, hunk);
        if (!canApply) {
          errors.push({
            type: 'content_mismatch',
            message: `Diff does not match current content of ${diff.filepath}`,
            filepath: diff.filepath,
            details: `Hunk at line ${hunk.oldStart} cannot be applied. The file may have been modified or the AI is suggesting changes for another context.`,
          });
        }
      }
    } catch (error) {
      errors.push({
        type: 'file_not_found',
        message: `Error reading file ${diff.filepath}`,
        filepath: diff.filepath,
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

async function validateSearchReplace(
  sr: SearchReplace,
  fileOps: FileOperations,
  _options: ValidationOptions
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!sr.filepath) {
    return { valid: true, errors, warnings };
  }

  const exists = await fileOps.fileExists(sr.filepath);

  if (!exists) {
    errors.push({
      type: 'file_not_found',
      message: `Arquivo não existe: ${sr.filepath}`,
      filepath: sr.filepath,
    });
    return { valid: false, errors, warnings };
  }

  try {
    const content = await fileOps.readFile(sr.filepath);
    if (!content.includes(sr.search)) {
      errors.push({
        type: 'content_mismatch',
        message: `Padrão de busca não encontrado em ${sr.filepath}`,
        filepath: sr.filepath,
        details: 'A IA pode estar tentando modificar conteúdo que não existe neste arquivo.',
      });
    }
  } catch (error) {}

  return { valid: errors.length === 0, errors, warnings };
}

function calculateChangeStats(oldContent: string, newContent: string) {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  let linesChanged = 0;
  const maxLen = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLen; i++) {
    if (oldLines[i] !== newLines[i]) {
      linesChanged++;
    }
  }

  const changePercentage = oldLines.length > 0 ? linesChanged / oldLines.length : 1;

  return {
    linesChanged,
    changePercentage,
    oldLines: oldLines.length,
    newLines: newLines.length,
  };
}

function verifyHunkCanBeApplied(lines: string[], hunk: any): boolean {
  const startLine = hunk.oldStart - 1;

  if (startLine < 0 || startLine >= lines.length) {
    return false;
  }

  return true;
}

export function formatValidationErrors(result: ValidationResult): string {
  let message = '';

  if (result.errors.length > 0) {
    message += '❌ **Erros de Validação:**\n\n';
    for (const error of result.errors) {
      message += `- **${error.type}**: ${error.message}\n`;
      if (error.details) {
        message += `  ${error.details}\n`;
      }
      message += '\n';
    }
  }

  if (result.warnings.length > 0) {
    message += '⚠️  **Avisos:**\n\n';
    for (const warning of result.warnings) {
      message += `- **${warning.type}**: ${warning.message}\n\n`;
    }
  }

  return message;
}
