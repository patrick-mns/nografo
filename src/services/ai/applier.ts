import type {
  CodeBlock,
  UnifiedDiff,
  DiffHunk,
  SearchReplace,
  JSONEdit,
  ParsedAIResponse,
} from './types';
import { AIResponseFormat } from './types';
import { validateAIResponse, formatValidationErrors, type ValidationOptions } from './validation';

export interface ApplyResult {
  success: boolean;
  filepath?: string;
  message: string;
  error?: string;
}

export interface ApplyOptions {
  agentMode?: boolean;

  confirmFn?: (description: string, preview: string) => Promise<boolean>;

  onProgress?: (step: string) => void;

  createBackup?: boolean;

  validation?: ValidationOptions;

  enableValidation?: boolean;
}

export interface FileOperations {
  readFile(filepath: string): Promise<string>;

  writeFile(filepath: string, content: string): Promise<void>;

  deleteFile(filepath: string): Promise<void>;

  fileExists(filepath: string): Promise<boolean>;

  createBackup?(filepath: string): Promise<string>;
}

export async function applyParsedResponse(
  parsed: ParsedAIResponse,
  fileOps: FileOperations,
  options: ApplyOptions = {}
): Promise<ApplyResult[]> {
  const results: ApplyResult[] = [];
  const { onProgress, enableValidation = false } = options;

  onProgress?.('Starting to apply changes...');

  if (enableValidation) {
    onProgress?.('Validating changes...');

    const validationResult = await validateAIResponse(parsed, fileOps, options.validation);

    if (!validationResult.valid) {
      const errorMessage = formatValidationErrors(validationResult);
      results.push({
        success: false,
        message: `❌ Validation failed:\n\n${errorMessage}`,
      });

      return results;
    }

    if (validationResult.warnings.length > 0 && !options.agentMode && options.confirmFn) {
      const warningMessage = formatValidationErrors(validationResult);
      const confirmed = await options.confirmFn(
        'Validation warnings detected. Do you want to continue?',
        warningMessage
      );

      if (!confirmed) {
        results.push({
          success: false,
          message: 'Operation cancelled by user after validation warnings',
        });
        return results;
      }
    }
  }

  switch (parsed.format) {
    case AIResponseFormat.CODE_BLOCK:
    case AIResponseFormat.MULTIPLE_CODE_BLOCKS:
      for (const block of parsed.codeBlocks) {
        if (block.filepath) {
          onProgress?.(`Applying ${block.filepath}...`);
          const result = await applyCodeBlock(block, fileOps, options);
          results.push(result);
        }
      }
      break;

    case AIResponseFormat.UNIFIED_DIFF:
      for (const diff of parsed.unifiedDiffs) {
        onProgress?.(`Applying diff to ${diff.filepath}...`);
        const result = await applyUnifiedDiff(diff, fileOps, options);
        results.push(result);
      }
      break;

    case AIResponseFormat.SEARCH_REPLACE:
      for (const sr of parsed.searchReplaces) {
        onProgress?.(`Applying search/replace...`);
        const result = await applySearchReplace(sr, fileOps, options);
        results.push(result);
      }
      break;

    case AIResponseFormat.JSON_EDIT:
      for (const edit of parsed.jsonEdits) {
        onProgress?.(`Applying ${edit.operation} to ${edit.filepath}...`);
        const result = await applyJSONEdit(edit, fileOps, options);
        results.push(result);
      }
      break;

    case AIResponseFormat.PLAIN_TEXT:
      results.push({
        success: false,
        message: 'Plain text response, no applicable actions',
      });
      break;
  }

  return results;
}

export async function applyCodeBlock(
  block: CodeBlock,
  fileOps: FileOperations,
  options: ApplyOptions = {}
): Promise<ApplyResult> {
  const { filepath, content } = block;

  if (!filepath) {
    return {
      success: false,
      message: 'Code block without specified filepath',
    };
  }

  try {
    const exists = await fileOps.fileExists(filepath);
    const action = exists ? 'update' : 'create';

    if (!options.agentMode && options.confirmFn) {
      const confirmed = await options.confirmFn(
        `Do you want to ${action} file ${filepath}?`,
        content
      );

      if (!confirmed) {
        return {
          success: false,
          filepath,
          message: 'Operation cancelled by user',
        };
      }
    }

    if (exists && options.createBackup && fileOps.createBackup) {
      await fileOps.createBackup(filepath);
    }

    await fileOps.writeFile(filepath, content);

    return {
      success: true,
      filepath,
      message: `File ${action === 'create' ? 'created' : 'updated'} successfully: ${filepath}`,
    };
  } catch (error) {
    return {
      success: false,
      filepath,
      message: `Error applying code block`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function applyUnifiedDiff(
  diff: UnifiedDiff,
  fileOps: FileOperations,
  options: ApplyOptions = {}
): Promise<ApplyResult> {
  const { filepath, hunks } = diff;

  try {
    const exists = await fileOps.fileExists(filepath);
    if (!exists) {
      return {
        success: false,
        filepath,
        message: `File not found: ${filepath}`,
      };
    }

    const currentContent = await fileOps.readFile(filepath);
    const lines = currentContent.split('\n');

    const newLines = applyHunksToLines(lines, hunks);
    const newContent = newLines.join('\n');

    if (!options.agentMode && options.confirmFn) {
      const preview = generateDiffPreview(lines, newLines);
      const confirmed = await options.confirmFn(
        `Do you want to apply changes to ${filepath}?`,
        preview
      );

      if (!confirmed) {
        return {
          success: false,
          filepath,
          message: 'Operation cancelled by user',
        };
      }
    }

    if (options.createBackup && fileOps.createBackup) {
      await fileOps.createBackup(filepath);
    }

    await fileOps.writeFile(filepath, newContent);

    return {
      success: true,
      filepath,
      message: `Diff applied successfully: ${filepath}`,
    };
  } catch (error) {
    return {
      success: false,
      filepath,
      message: `Error applying diff`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function applyHunksToLines(lines: string[], hunks: DiffHunk[]): string[] {
  const newLines = [...lines];

  const sortedHunks = [...hunks].sort((a, b) => b.oldStart - a.oldStart);

  for (const hunk of sortedHunks) {
    const startIndex = hunk.oldStart - 1;
    let currentOldLine = startIndex;
    let currentNewLine = startIndex;
    const toInsert: string[] = [];
    const toRemove: number[] = [];

    for (const diffLine of hunk.lines) {
      switch (diffLine.type) {
        case 'add':
          toInsert.push(diffLine.content);
          currentNewLine++;
          break;
        case 'remove':
          toRemove.push(currentOldLine);
          currentOldLine++;
          break;
        case 'context':
          currentOldLine++;
          currentNewLine++;
          break;
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      newLines.splice(toRemove[i], 1);
    }

    newLines.splice(startIndex, 0, ...toInsert);
  }

  return newLines;
}

function generateDiffPreview(oldLines: string[], newLines: string[]): string {
  const preview: string[] = [];
  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < Math.min(maxLines, 20); i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine !== newLine) {
      if (oldLine !== undefined) {
        preview.push(`- ${oldLine}`);
      }
      if (newLine !== undefined) {
        preview.push(`+ ${newLine}`);
      }
    } else if (oldLine !== undefined) {
      preview.push(`  ${oldLine}`);
    }
  }

  if (maxLines > 20) {
    preview.push(`... (${maxLines - 20} linhas omitidas)`);
  }

  return preview.join('\n');
}

export async function applySearchReplace(
  sr: SearchReplace,
  fileOps: FileOperations,
  options: ApplyOptions = {},
  filepath?: string
): Promise<ApplyResult> {
  const { search, replace } = sr;
  const targetPath = sr.filepath || filepath;

  if (!targetPath) {
    return {
      success: false,
      message: 'Filepath not specified for search/replace',
    };
  }

  try {
    const exists = await fileOps.fileExists(targetPath);
    if (!exists) {
      return {
        success: false,
        filepath: targetPath,
        message: `File not found: ${targetPath}`,
      };
    }

    const currentContent = await fileOps.readFile(targetPath);

    if (!currentContent.includes(search)) {
      return {
        success: false,
        filepath: targetPath,
        message: `Search text not found in file`,
      };
    }

    const newContent = currentContent.replace(search, replace);

    if (!options.agentMode && options.confirmFn) {
      const preview = `SEARCH:\n${search}\n\nREPLACE:\n${replace}`;
      const confirmed = await options.confirmFn(
        `Do you want to apply replacement to ${targetPath}?`,
        preview
      );

      if (!confirmed) {
        return {
          success: false,
          filepath: targetPath,
          message: 'Operation cancelled by user',
        };
      }
    }

    if (options.createBackup && fileOps.createBackup) {
      await fileOps.createBackup(targetPath);
    }

    await fileOps.writeFile(targetPath, newContent);

    return {
      success: true,
      filepath: targetPath,
      message: `Search/replace applied successfully: ${targetPath}`,
    };
  } catch (error) {
    return {
      success: false,
      filepath: targetPath,
      message: `Error applying search/replace`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function applyJSONEdit(
  edit: JSONEdit,
  fileOps: FileOperations,
  options: ApplyOptions = {}
): Promise<ApplyResult> {
  const { filepath, operation, content } = edit;

  try {
    switch (operation) {
      case 'create':
      case 'update': {
        if (!content) {
          return {
            success: false,
            filepath,
            message: 'Content not specified for create/update operation',
          };
        }

        const exists = await fileOps.fileExists(filepath);
        const action = operation === 'create' ? 'create' : 'update';

        if (!options.agentMode && options.confirmFn) {
          const confirmed = await options.confirmFn(
            `Do you want to ${action} file ${filepath}?`,
            content
          );

          if (!confirmed) {
            return {
              success: false,
              filepath,
              message: 'Operation cancelled by user',
            };
          }
        }

        if (exists && operation === 'update' && options.createBackup && fileOps.createBackup) {
          await fileOps.createBackup(filepath);
        }

        await fileOps.writeFile(filepath, content);

        return {
          success: true,
          filepath,
          message: `File ${operation === 'create' ? 'created' : 'updated'}: ${filepath}`,
        };
      }
      case 'delete': {
        const fileExists = await fileOps.fileExists(filepath);
        if (!fileExists) {
          return {
            success: false,
            filepath,
            message: `File not found: ${filepath}`,
          };
        }

        if (!options.agentMode && options.confirmFn) {
          const confirmed = await options.confirmFn(
            `Do you want to delete file ${filepath}?`,
            'This operation cannot be undone.'
          );

          if (!confirmed) {
            return {
              success: false,
              filepath,
              message: 'Operation cancelled by user',
            };
          }
        }

        if (options.createBackup && fileOps.createBackup) {
          await fileOps.createBackup(filepath);
        }

        await fileOps.deleteFile(filepath);

        return {
          success: true,
          filepath,
          message: `File deleted: ${filepath}`,
        };
      }
      default:
        return {
          success: false,
          filepath,
          message: `Unknown operation: ${operation}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      filepath,
      message: `Error executing operation ${operation}`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function applyCodeBlocksBatch(
  blocks: CodeBlock[],
  fileOps: FileOperations,
  options: ApplyOptions = {}
): Promise<ApplyResult[]> {
  const results: ApplyResult[] = [];

  for (const block of blocks) {
    if (block.filepath) {
      const result = await applyCodeBlock(block, fileOps, options);
      results.push(result);
    }
  }

  return results;
}

export function hasErrors(results: ApplyResult[]): boolean {
  return results.some((r) => !r.success);
}

export function formatResults(results: ApplyResult[]): string {
  const messages: string[] = [];

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (successful.length > 0) {
    messages.push(`✅ ${successful.length} operation(s) successful:`);
    successful.forEach((r) => messages.push(`  - ${r.message}`));
  }

  if (failed.length > 0) {
    messages.push(`\n❌ ${failed.length} operation(s) failed:`);
    failed.forEach((r) => {
      messages.push(`  - ${r.message}`);
      if (r.error) {
        messages.push(`    Error: ${r.error}`);
      }
    });
  }

  return messages.join('\n');
}
