import { useGraphStore } from '@/store/graphStore';
import { getWorkspaceAPI } from '@/lib/electron';

interface ContextNode {
  id: string;
  label: string;
  content: string;
  active: boolean;
  graphId: string;
  depth: number;
}

export const collectActiveContextRecursive = async (
  currentNodes: any[],
  currentGraphId: string,
  depth: number = 0,
  maxDepth: number = 3,
  visitedGraphs: Set<string> = new Set()
): Promise<ContextNode[]> => {
  if (depth >= maxDepth) {
    return [];
  }

  if (visitedGraphs.has(currentGraphId)) {
    return [];
  }

  visitedGraphs.add(currentGraphId);

  const activeNodes = currentNodes.filter((n) => n.data.active);

  const collectedContext: ContextNode[] = [];

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
        console.error('[ContextCollector] ❌ Error loading reference:', error);
      }
    }
  }

  return collectedContext;
};

export const useContextCollector = () => {
  const { nodes, edges } = useGraphStore();

  const collectContext = async (currentGraphId: string, maxDepth: number = 3) => {
    const activeContextNodes = await collectActiveContextRecursive(
      nodes,
      currentGraphId,
      0,
      maxDepth,
      new Set()
    );

    return {
      nodes: activeContextNodes,
      edges: edges.map((e) => ({
        source: e.source,
        target: e.target,
      })),
    };
  };

  return { collectContext };
};
