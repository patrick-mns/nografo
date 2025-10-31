import { useGraphStore } from '@/store/graphStore';

export interface NewGraphOptions {
  onSaveToWorkspace?: (graphId: string, graphData: unknown) => Promise<boolean> | Promise<void>;
  onRefreshGraphs?: () => Promise<void>;
}

export interface NewGraphResult {
  id: string;
  name: string;
  description: string;
}

export const createNewGraph = async (options?: NewGraphOptions): Promise<NewGraphResult> => {
  const { onSaveToWorkspace, onRefreshGraphs } = options || {};

  const {
    currentGraph: existingGraph,
    nodes: currentNodes,
    edges: currentEdges,
    setCurrentGraph,
    loadGraphData,
  } = useGraphStore.getState();

  if (existingGraph && (currentNodes.length > 0 || currentEdges.length > 0) && onSaveToWorkspace) {
    try {
      const dataWithMetadata = {
        nodes: currentNodes,
        edges: currentEdges,
        id: existingGraph.id,
        name: existingGraph.name,
        description: existingGraph.description,
        repository_owner: existingGraph.repository_owner,
        repository_name: existingGraph.repository_name,
        repository_branch: existingGraph.repository_branch,
        sync_enabled: existingGraph.sync_enabled,
      };

      await onSaveToWorkspace(existingGraph.id, dataWithMetadata);
    } catch (saveError) {
      console.error('Error saving current graph before creating new:', saveError);
      throw new Error(
        'Could not save current graph automatically. Make sure to save it manually if needed.'
      );
    }
  }

  const timestamp = Date.now();
  const newGraphId = `graph-${timestamp}`;
  const newGraphName = `New Graph ${timestamp}`;

  const emptyGraphData = {
    nodes: [],
    edges: [],
    id: newGraphId,
    name: newGraphName,
    description: '',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const newGraph = {
    id: newGraphId,
    name: newGraphName,
    description: '',
  };

  setCurrentGraph(newGraph);
  loadGraphData(emptyGraphData);

  if (onSaveToWorkspace) {
    try {
      const result = await onSaveToWorkspace(newGraphId, emptyGraphData);

      if (onRefreshGraphs && result !== false) {
        await onRefreshGraphs();
      }
    } catch (saveError) {
      console.error('Error saving new graph to workspace:', saveError);
      throw new Error('Failed to save new graph to workspace');
    }
  }

  return newGraph;
};
