import { useCallback } from 'react';
import { useSecretsStore } from '@/store/secretsStore';
import { isElectron, getWorkspaceAPI } from '@/lib/electron';
import { virtualWorkspaceManager } from '@/lib/virtualWorkspace';
import { generateContextMarkdown } from '@/lib/contextExporter';
import { collectActiveContextRecursive } from '@/services/contextCollector';
import { useToast } from './useToast';
import type { Node, Edge } from '@/store/graphStore';

export function useContextExport() {
  const { config } = useSecretsStore();
  const { toast } = useToast();
  const workspaceAPI = getWorkspaceAPI();

  const getModelName = useCallback(() => {
    switch (config.selectedProvider) {
      case 'openai':
        return config.openaiModel || 'gpt-4';
      case 'anthropic':
        return config.anthropicModel || 'claude-3-sonnet-20240229';
      case 'ollama':
        return config.ollamaModel || 'llama3.1';
      default:
        return 'unknown';
    }
  }, [config.selectedProvider, config.openaiModel, config.anthropicModel, config.ollamaModel]);

  const exportActiveContext = useCallback(
    async (
      nodes: Node[],
      edges: Edge[],
      userPrompt?: string,
      currentGraphId?: string
    ): Promise<boolean> => {
      const isElectronEnv = isElectron();

      try {
        const contextNodes = await collectActiveContextRecursive(
          nodes,
          currentGraphId || 'current',
          0,
          3,
          new Set()
        );

        const enrichedNodes: Node[] = contextNodes.map((cn) => ({
          id: cn.id,
          type: 'contextNode',
          position: { x: 0, y: 0 },
          data: {
            label: cn.label,
            content: cn.content,
            active: cn.active,
            graphId: cn.graphId,
            graphName: cn.graphId,
            attachedFiles: [],
          },
        }));

        const markdown = generateContextMarkdown(enrichedNodes, edges, {
          includeInactiveNodes: false,
          includeMetadata: true,
          includeConnections: true,
          promptInfo: {
            provider: config.selectedProvider || 'openai',
            model: getModelName(),
            promptType: 'context-export',
          },
          userPrompt,
        });

        if (isElectronEnv && workspaceAPI) {
          await workspaceAPI.writeFile('current-context.md', markdown);
        } else {
          await virtualWorkspaceManager.writeFile('current-context.md', markdown);
        }

        return true;
      } catch (error) {
        console.error('Error exporting context:', error);
        toast({
          variant: 'destructive',
          title: 'Export Failed',
          description: error instanceof Error ? error.message : 'Failed to export context',
        });
        return false;
      }
    },
    [workspaceAPI, toast, config, getModelName]
  );

  const exportContextToFile = useCallback(
    async (nodes: Node[], edges: Edge[], filename: string): Promise<boolean> => {
      const isElectronEnv = isElectron();

      try {
        const markdown = generateContextMarkdown(nodes, edges, {
          includeInactiveNodes: false,
          includeMetadata: true,
          includeConnections: true,
          promptInfo: {
            provider: config.selectedProvider || 'openai',
            model: getModelName(),
            promptType: 'context-export',
          },
        });

        const filepath = filename.startsWith('context/') ? filename : `context/${filename}`;

        if (isElectronEnv && workspaceAPI) {
          await workspaceAPI.writeFile(filepath, markdown);
        } else {
          await virtualWorkspaceManager.writeFile(filepath, markdown);
        }

        toast({
          title: 'Context Exported',
          description: `Context saved to ${filepath}`,
        });

        return true;
      } catch (error) {
        console.error('Error exporting context:', error);
        toast({
          variant: 'destructive',
          title: 'Export Failed',
          description: error instanceof Error ? error.message : 'Failed to export context',
        });
        return false;
      }
    },
    [workspaceAPI, toast, config, getModelName]
  );

  return {
    exportActiveContext,
    exportContextToFile,
  };
}
