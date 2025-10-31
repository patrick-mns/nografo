import { useGraphStore } from '@/store/graphStore';
import { aiService } from '@/services/aiService';
import { applyParsedResponse, createAutoFileOperations, type ApplyOptions } from '@/services/ai';
import { useContextExport } from './useContextExport';
import { useChatStore } from '@/store/chatStore';
import { useDeveloperSettingsStore } from '@/store/developerSettingsStore';
import { createStreamParser } from '@/utils/incrementalJsonParser';
import { getWorkspaceAPI } from '@/lib/electron';
import type { ParsedNode, ParsedEdge } from '@/utils/incrementalJsonParser';

export const useMessageHandlers = (
  config: any,
  updateMessage: (id: string, updates: any) => void,
  addAssistantMessage: (content: string) => void
) => {
  const {
    nodes,
    edges,
    addNode,
    setNodes,
    loadGraph,
    updateNode,
    currentGraph,
    setGraphLocked,
    setShouldFitView,
  } = useGraphStore();
  const { exportActiveContext } = useContextExport();
  const { updateCodeActionStatus } = useChatStore();

  const generateContextualPrompt = (): any => {
    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        label: n.data.label,
        content: n.data.content,
        active: n.data.active,
      })),
      edges: edges.map((e) => ({
        source: e.source,
        target: e.target,
      })),
    };
  };

  const parseGraphResponse = (response: string) => {
    const actions = [];

    try {
      const jsonData = JSON.parse(response.trim());
      if (jsonData.nodes) {
        actions.push({ type: 'newGraph', data: jsonData });
        return { cleanResponse: 'Context applied successfully!', actions };
      }
    } catch (e) {
      const jsonMatch = response.match(/\{[\s\S]*"nodes"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const jsonData = JSON.parse(jsonMatch[0]);
          if (jsonData.nodes) {
            actions.push({ type: 'newGraph', data: jsonData });
            return { cleanResponse: 'Context applied successfully!', actions };
          }
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
        }
      }
    }

    return { cleanResponse: response, actions };
  };

  const executeActions = (actions: any[]) => {
    actions.forEach((action) => {
      switch (action.type) {
        case 'newGraph':
          if (action.data.nodes && action.data.edges) {
            if (nodes.length > 0) {
              const allNodes = [...nodes, ...action.data.nodes];
              const allEdges = [...edges, ...action.data.edges];
              loadGraph(JSON.stringify({ nodes: allNodes, edges: allEdges }));
            } else {
              loadGraph(JSON.stringify(action.data));
            }
          } else if (action.data.nodes) {
            if (nodes.length > 0) {
              const allNodes = [...nodes, ...action.data.nodes];
              setNodes(allNodes);
            } else {
              setNodes(action.data.nodes);
            }
          }
          break;
        case 'addNodes':
          if (Array.isArray(action.data)) {
            action.data.forEach((nodeData: any) => {
              addNode({
                type: nodeData.type || 'contextNode',
                position: nodeData.position || {
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 400 - 200,
                },
                data: nodeData.data,
              });
            });
          }
          break;
      }
    });
  };

  const handleActiveCommand = async (argument: string, loadingMsgId?: string) => {
    try {
      const context = generateContextualPrompt();
      const response = await aiService.activeCommand(argument, context, config);

      const activeNodeIds = JSON.parse(response.trim());
      nodes.forEach((node) => {
        const shouldBeActive = activeNodeIds.includes(node.id);
        if (node.data.active !== shouldBeActive) {
          updateNode(node.id, { active: shouldBeActive });
        }
      });

      const successMessage = `Updated active status for ${activeNodeIds.length} nodes.`;

      if (loadingMsgId) {
        updateMessage(loadingMsgId, { content: successMessage });
      } else {
        addAssistantMessage(successMessage);
      }

      const updatedNodes = useGraphStore.getState().nodes;
      const updatedEdges = useGraphStore.getState().edges;

      await exportActiveContext(
        updatedNodes,
        updatedEdges,
        argument,
        currentGraph?.id || 'current'
      );
    } catch (error) {
      console.error('Error parsing active command response:', error);
      const errorMessage = 'Error: Active command failed';

      if (loadingMsgId) {
        updateMessage(loadingMsgId, { content: errorMessage });
      } else {
        addAssistantMessage(errorMessage);
      }
    }
  };

  const handleAddCommand = async (argument: string, loadingMsgId?: string) => {
    setGraphLocked(true);
    try {
      const context = generateContextualPrompt();
      const response = await aiService.addCommand(argument, context, config);

      const { cleanResponse, actions } = parseGraphResponse(response);

      if (loadingMsgId) {
        updateMessage(loadingMsgId, { content: cleanResponse });
      } else {
        addAssistantMessage(cleanResponse);
      }

      if (actions.length > 0) {
        executeActions(actions);
        setShouldFitView(true);
      }
    } catch (error) {
      console.error('Error in add command:', error);
      const errorMessage = 'Error: Add command failed';

      if (loadingMsgId) {
        updateMessage(loadingMsgId, { content: errorMessage });
      } else {
        addAssistantMessage(errorMessage);
      }
    } finally {
      setGraphLocked(false);
    }
  };

  const handleCreateCommand = async (argument: string, loadingMsgId?: string) => {
    const { isIncrementalStreamEnabled } = useDeveloperSettingsStore.getState();

    setGraphLocked(true);
    try {
      if (isIncrementalStreamEnabled) {
        const parser = createStreamParser();
        let nodeCount = 0;

        await aiService.createCommandStream(argument, config, (chunk: string) => {
          const updates = parser.addChunk(chunk);

          for (const update of updates) {
            if (update.type === 'node' && update.data) {
              const nodeData = update.data as ParsedNode;
              addNode({
                type: nodeData.type || 'contextNode',
                position: nodeData.position || {
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 400 - 200,
                },
                data: {
                  ...nodeData.data,
                  active: nodeData.data.active ?? false,
                },
              });

              nodeCount++;

              if (nodeCount % 2 === 0) {
                setShouldFitView(true);
              }
            } else if (update.type === 'edge' && update.data) {
              const edgeData = update.data as ParsedEdge;
              console.log('Edge received:', edgeData);
            } else if (update.type === 'complete' && update.data) {
              console.log('Graph structure complete, waiting for stream to finish...');
            }
          }
        });

        const finalGraph = parser.finalize();
        console.log('Stream completed, final graph:', finalGraph);

        if (finalGraph.edges && finalGraph.edges.length > 0) {
          loadGraph(JSON.stringify(finalGraph));
        }

        setShouldFitView(true);

        if (loadingMsgId) {
          updateMessage(loadingMsgId, { content: 'Context created successfully!' });
        } else {
          addAssistantMessage('Context created successfully!');
        }
      } else {
        const response = await aiService.createCommand(argument, config);

        const { cleanResponse, actions } = parseGraphResponse(response);

        if (loadingMsgId) {
          updateMessage(loadingMsgId, { content: cleanResponse });
        } else {
          addAssistantMessage(cleanResponse);
        }

        if (actions.length > 0) {
          executeActions(actions);
          setShouldFitView(true);
        }
      }
    } catch (error) {
      console.error('Error in create command:', error);
      const errorMessage = 'Error: Create command failed';

      if (loadingMsgId) {
        updateMessage(loadingMsgId, { content: errorMessage });
      } else {
        addAssistantMessage(errorMessage);
      }
    } finally {
      setGraphLocked(false);
    }
  };

  const createCodeActions = async (codeBlocks: any[], parsed: any, initialMsgId: string) => {
    const fileCodeBlocks = codeBlocks.filter((block) => {
      if (!block.filepath || block.filepath.startsWith('untitled')) {
        return false;
      }
      return true;
    });

    if (fileCodeBlocks.length === 0) return [];

    return await Promise.all(
      fileCodeBlocks.map(async (block) => {
        let isEdit = false;
        try {
          const workspaceAPI = getWorkspaceAPI();
          if (workspaceAPI?.readFile && block.filepath) {
            const result = await workspaceAPI.readFile(block.filepath);
            if (result.content) {
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
            updateCodeActionStatus(initialMsgId, block.filepath!, 'accepted');

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

              const singleBlockParsed = {
                ...parsed,
                codeBlocks: [block],
              };

              const results = await applyParsedResponse(singleBlockParsed, fileOps, applyOptions);

              const successCount = results.filter((r) => r.success).length;
              const failureCount = results.filter((r) => !r.success).length;

              if (successCount > 0) {
                addAssistantMessage(`✅ Successfully applied changes to \`${block.filepath}\``);
              } else if (failureCount > 0) {
                addAssistantMessage(
                  `❌ Failed to apply changes: ${results[0]?.error || 'Unknown error'}`
                );
              }
            } catch (error) {
              console.error('[useMessageHandlers] Error applying changes:', error);
              addAssistantMessage(
                `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          },
          onReject: () => {
            updateCodeActionStatus(initialMsgId, block.filepath!, 'rejected');
          },
        };
      })
    );
  };

  return {
    generateContextualPrompt,
    parseGraphResponse,
    executeActions,
    handleActiveCommand,
    handleAddCommand,
    handleCreateCommand,
    createCodeActions,
  };
};
