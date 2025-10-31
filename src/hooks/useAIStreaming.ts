import { useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import { aiService } from '@/services/aiService';
import {
  parseAIResponse,
  applyParsedResponse,
  createAutoFileOperations,
  type ApplyOptions,
} from '@/services/ai';
import type { AIConfig } from '@/store/secretsStore';
import type { RAGContext } from '@/services/ragService';
import { useGraphStore } from '@/store/graphStore';

export const useAIStreaming = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSearchingRAG, setIsSearchingRAG] = useState(false);
  const [currentRAGContext, setCurrentRAGContext] = useState<RAGContext | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { currentGraph } = useGraphStore();

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  const streamResponse = async (
    command: string,
    context: any,
    conversationHistory: any[],
    config: AIConfig,
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void
  ) => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setIsStreaming(true);
    setIsSearchingRAG(true);
    setCurrentRAGContext(null);

    let fullResponse = '';
    let ragContextReceived = false;

    try {
      await aiService.regularCommandStream(
        command,
        context,
        conversationHistory,
        config,
        (chunk) => {
          fullResponse += chunk;

          flushSync(() => {
            onChunk(fullResponse);
          });
        },

        (ragContext) => {
          ragContextReceived = true;
          setIsSearchingRAG(false);
          setCurrentRAGContext(ragContext);
        },
        signal
      );

      if (!ragContextReceived) {
        setIsSearchingRAG(false);
      }

      onComplete(fullResponse);
    } catch (error) {
      console.error('[AIStreaming] Streaming error:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        onChunk(fullResponse + '\n\n_[Streaming interrompido]_');
      } else {
        onError(error as Error);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }

    return fullResponse;
  };

  const parseAndCreateCodeActions = async (
    response: string,
    messageId: string,
    onAcceptAction: (filepath: string) => Promise<void>,
    onRejectAction: (filepath: string) => void
  ) => {
    const parsed = parseAIResponse(response);

    parsed.codeBlocks.forEach(() => {});

    const fileCodeBlocks = parsed.codeBlocks.filter((block) => {
      if (!block.filepath || block.filepath.startsWith('untitled')) {
        return false;
      }
      return true;
    });

    if (fileCodeBlocks.length === 0) {
      return { codeActions: [], contentWithoutCodeBlocks: response };
    }

    const codeActions = await Promise.all(
      fileCodeBlocks.map(async (block) => {
        let isEdit = false;
        try {
          if (window.electron?.git?.readFile && block.filepath) {
            const result = await window.electron.git.readFile(block.filepath);
            if (result.success) {
              isEdit = true;
            }
          }
        } catch (error) {
          isEdit = false;
        }

        return {
          filepath: block.filepath!,
          code: block.content,
          language: block.language || 'text',
          description: parsed.textMessages[0],
          status: 'pending' as const,
          isEdit,
          onAccept: async () => {
            await onAcceptAction(block.filepath!);
          },
          onReject: () => {
            onRejectAction(block.filepath!);
          },
        };
      })
    );

    const contentWithoutCodeBlocks = parsed.textMessages.join('\n\n').trim();

    return {
      codeActions,
      contentWithoutCodeBlocks: contentWithoutCodeBlocks || 'Code changes detected:',
      parsed,
    };
  };

  const applyCodeAction = async (filepath: string, parsed: any) => {
    try {
      const fileOps = createAutoFileOperations(
        currentGraph?.repository_owner && currentGraph?.repository_name
          ? {
              owner: currentGraph.repository_owner,
              repo: currentGraph.repository_name,
              branch: currentGraph.repository_branch || 'main',
            }
          : undefined
      );

      const applyOptions: ApplyOptions = {
        agentMode: true,
        createBackup: false,
      };

      const results = await applyParsedResponse(parsed, fileOps, applyOptions);

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      if (successCount > 0) {
        return { success: true, message: `✅ Successfully applied changes to \`${filepath}\`` };
      } else if (failureCount > 0) {
        console.error('[AIStreaming] Apply errors:', results);
        return {
          success: false,
          message: `❌ Failed to apply changes: ${results[0]?.error || 'Unknown error'}`,
        };
      }

      return { success: false, message: 'No changes applied' };
    } catch (error) {
      console.error('[AIStreaming] Error applying changes:', error);
      return {
        success: false,
        message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };

  return {
    isLoading,
    isStreaming,
    isSearchingRAG,
    currentRAGContext,
    stopStreaming,
    streamResponse,
    parseAndCreateCodeActions,
    applyCodeAction,
  };
};
