import { useState, useCallback } from 'react';
import { useGraphStore } from '../store/graphStore';
import type { Graph } from '../types/api';

interface UseGraphLoaderResult {
  graph: Graph | null;
  loading: boolean;
  error: string | null;
  loadGraph: (id: string) => Promise<void>;
}

export function useGraphLoader(): UseGraphLoaderResult {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setNodes, setEdges, setCurrentGraph } = useGraphStore();

  const loadGraph = useCallback(
    async (id: string) => {
      if (!id) {
        setError('Graph ID is required');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const currentState = useGraphStore.getState();
        const { currentGraph, nodes, edges } = currentState;

        if (currentGraph && (nodes.length > 0 || edges.length > 0)) {
          // Note: This hook doesn't have access to workspace saving functions
          // In a real implementation, this should be handled by a higher-level component
          console.warn(
            'useGraphLoader: Current graph data exists but cannot be automatically saved. Consider using GraphExplorer instead.'
          );
        }

        const stored = localStorage.getItem('ai-graph-context-manager');
        if (!stored) {
          throw new Error('No graph data found');
        }

        const graphData = JSON.parse(stored) as Graph;

        if (
          !graphData.data ||
          !Array.isArray(graphData.data.nodes) ||
          !Array.isArray(graphData.data.edges)
        ) {
          throw new Error('Invalid graph data');
        }

        setGraph(graphData);

        setCurrentGraph({
          id: graphData.id,
          name: graphData.name,
          description: graphData.description,
          repository_owner: graphData.repository_owner,
          repository_name: graphData.repository_name,
          repository_branch: graphData.repository_branch,
          sync_enabled: graphData.sync_enabled,
        });

        setNodes(graphData.data.nodes as any);
        setEdges(graphData.data.edges as any);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error loading graph';
        setError(errorMessage);
        console.error('Error loading graph:', err);
      } finally {
        setLoading(false);
      }
    },
    [setNodes, setEdges, setCurrentGraph]
  );

  return {
    graph,
    loading,
    error,
    loadGraph,
  };
}
