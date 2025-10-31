import { useGraphStore } from '@/store/graphStore';
import { getWorkspaceAPI } from '@/lib/electron';

export const useActiveContext = () => {
  const { updateNode, loadGraph, setCurrentGraph } = useGraphStore();

  const collectActiveContextRecursive = async (
    currentNodes: any[],
    currentGraphId: string,
    depth: number = 0,
    maxDepth: number = 3,
    visitedGraphs: Set<string> = new Set()
  ): Promise<any[]> => {
    if (depth >= maxDepth) {
      return [];
    }

    if (visitedGraphs.has(currentGraphId)) {
      return [];
    }

    visitedGraphs.add(currentGraphId);

    const activeNodes = currentNodes.filter((n) => n.data.active);

    const collectedContext: any[] = [];

    collectedContext.push(
      ...activeNodes.map((n) => ({
        id: n.id,
        label: n.data.label,
        content: n.data.content,
        active: true,
        graphId: currentGraphId,
        depth,
      }))
    );

    for (const node of activeNodes) {
      if (node.type === 'graphReferenceNode' && node.data.graphId) {
        try {
          let referencedGraph = null;

          if (node.data.graphId.startsWith('graph-')) {
            const workspaceAPI = getWorkspaceAPI();
            if (workspaceAPI) {
              const localGraph = await workspaceAPI.loadGraph(node.data.graphId);
              if (localGraph) {
                referencedGraph = {
                  id: node.data.graphId,
                  data: localGraph,
                };
              }
            }
          }

          if (!referencedGraph) {
            console.warn(`Graph ${node.data.graphId} not found`);
          }

          if (referencedGraph && referencedGraph.data) {
            const refNodes = (referencedGraph.data as any)?.nodes || [];
            const refContext = await collectActiveContextRecursive(
              refNodes,
              node.data.graphId,
              depth + 1,
              maxDepth,
              visitedGraphs
            );

            collectedContext.push(...refContext);
          }
        } catch (error) {
          console.error('[useActiveContext] ❌ Error loading reference:', error);
        }
      }
    }

    return collectedContext;
  };

  const activateRelevantNodes = async (
    command: string,
    context: any,
    config: any,
    aiService: any
  ) => {
    try {
      const response = await aiService.activeCommand(command, context, config);
      console.log('[useActiveContext] activeCommand response:', response);
      const relevantNodeIds = JSON.parse(response.trim());

      const currentNodes = useGraphStore.getState().nodes;

      currentNodes.forEach((node) => {
        if (node.data.active) {
          updateNode(node.id, { active: false });
        }
      });

      const activatedNodesInfo: string[] = [];
      const referenceNodesToOpen: Array<{ id: string; label: string; graphId: string }> = [];

      if (relevantNodeIds && relevantNodeIds.length > 0) {
        relevantNodeIds.forEach((nodeId: string) => {
          const node = currentNodes.find((n) => n.id === nodeId);
          if (node) {
            updateNode(nodeId, { active: true });
            activatedNodesInfo.push(node.data.label);

            if (node.type === 'graphReferenceNode' && node.data.graphId) {
              referenceNodesToOpen.push({
                id: node.id,
                label: node.data.label,
                graphId: node.data.graphId,
              });
            }
          }
        });
      }

      return {
        relevantNodeIds,
        activatedNodesInfo,
        referenceNodesToOpen,
      };
    } catch (error) {
      console.error('[useActiveContext] Error filtering context:', error);
      return {
        relevantNodeIds: [],
        activatedNodesInfo: [],
        referenceNodesToOpen: [],
      };
    }
  };

  const processGraphReferences = async (
    referenceNodes: Array<{ id: string; label: string; graphId: string }>,
    command: string,
    config: any,
    aiService: any,
    onMessage: (content: string) => void
  ) => {
    const MAX_DEPTH = 3;
    let currentDepth = 0;

    for (const ref of referenceNodes) {
      if (currentDepth >= MAX_DEPTH) {
        onMessage(
          `⚠️ **Depth limit reached**\n\nMaximum of ${MAX_DEPTH} reference levels allowed.`
        );
        break;
      }

      onMessage(
        `🔗 **Entering reference graph**\n\n📂 ${ref.label}\n\n_Loading additional context..._`
      );

      try {
        let referencedGraph = null;

        if (ref.graphId.startsWith('graph-')) {
          const workspaceAPI = getWorkspaceAPI();
          if (workspaceAPI) {
            const localGraph = await workspaceAPI.loadGraph(ref.graphId);
            if (localGraph) {
              referencedGraph = {
                id: ref.graphId,
                name: ref.label,
                data: localGraph,
                repository_owner: undefined,
                repository_name: undefined,
                repository_branch: undefined,
              };
            }
          }
        }

        if (!referencedGraph) {
          console.warn(`Graph ${ref.graphId} not found`);
        }

        if (!referencedGraph || !referencedGraph.data) {
          onMessage(`❌ **Error loading graph**\n\nCould not access: ${ref.label}`);
          return;
        }

        const refContext = {
          nodes: (referencedGraph.data as any)?.nodes || [],
          edges: (referencedGraph.data as any)?.edges || [],
          repository_owner: referencedGraph.repository_owner,
          repository_name: referencedGraph.repository_name,
          repository_branch: referencedGraph.repository_branch,
        };

        const refResponse = await aiService.activeCommand(command, refContext, config);
        const refRelevantNodeIds = JSON.parse(refResponse.trim());

        setCurrentGraph({
          id: ref.graphId,
          name: referencedGraph.name || ref.label,
          description: referencedGraph.description || '',
          repository_owner: referencedGraph.repository_owner,
          repository_name: referencedGraph.repository_name,
          repository_branch: referencedGraph.repository_branch,
        });

        loadGraph(JSON.stringify(referencedGraph.data));

        await new Promise((resolve) => setTimeout(resolve, 100));

        const currentLoadedNodes = useGraphStore.getState().nodes;

        currentLoadedNodes.forEach((node) => {
          if (node.data.active) {
            updateNode(node.id, { active: false });
          }
        });

        if (refRelevantNodeIds && refRelevantNodeIds.length > 0) {
          refRelevantNodeIds.forEach((nodeId: string) => {
            const node = currentLoadedNodes.find((n) => n.id === nodeId);
            if (node) {
              updateNode(nodeId, { active: true });
            }
          });

          await new Promise((resolve) => setTimeout(resolve, 200));

          window.dispatchEvent(
            new CustomEvent('focus-active-nodes', {
              detail: { nodeIds: refRelevantNodeIds },
            })
          );

          const refActivatedNodes = refRelevantNodeIds
            .map((nodeId: string) => {
              const node = (referencedGraph.data as any)?.nodes?.find((n: any) => n.id === nodeId);
              return node ? node.data.label : null;
            })
            .filter(Boolean);

          onMessage(
            `✅ **Context activated in "${ref.label}"**\n\n${refActivatedNodes
              .slice(0, 3)
              .map((name: string) => `📌 ${name}`)
              .join(
                '\n'
              )}${refActivatedNodes.length > 3 ? `\n📌 _+${refActivatedNodes.length - 3} more..._` : ''}\n\n_Continuing analysis..._`
          );
        } else {
          onMessage(
            `💡 **Graph "${ref.label}" checked**\n\nNo additional context needed from this graph.`
          );
        }

        currentDepth++;
      } catch (error) {
        console.error('[useActiveContext] Error loading reference graph:', error);
        onMessage(
          `❌ **Error processing reference**\n\n${ref.label}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    if (currentDepth > 0) {
      onMessage(
        `🎯 **Reference analysis completed**\n\nExplored ${currentDepth} level(s) of depth. Processing your request...`
      );
    }
  };

  return {
    collectActiveContextRecursive,
    activateRelevantNodes,
    processGraphReferences,
  };
};
