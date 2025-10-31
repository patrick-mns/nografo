import { useState, useEffect, useCallback } from 'react';
import {
  isElectron,
  getWorkspaceAPI,
  type WorkspaceInfo,
  type GraphMetadata,
} from '@/lib/electron';

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [graphs, setGraphs] = useState<GraphMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceAPI = getWorkspaceAPI();
  const isElectronEnv = isElectron();

  const loadWorkspace = useCallback(async () => {
    if (!isElectronEnv || !workspaceAPI) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const current = await workspaceAPI.getCurrent();
      setWorkspace(current);

      if (current) {
        const graphList = await workspaceAPI.listGraphs();
        setGraphs(graphList);
      } else {
        setGraphs([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace');
      console.error('Error loading workspace:', err);
    } finally {
      setLoading(false);
    }
  }, [isElectronEnv, workspaceAPI]);

  const selectWorkspace = useCallback(async () => {
    if (!workspaceAPI) {
      setError('Workspace API not available');
      return null;
    }

    try {
      setError(null);
      const result = await workspaceAPI.select();

      if (result) {
        await loadWorkspace();
      }

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select workspace');
      console.error('Error selecting workspace:', err);
      return null;
    }
  }, [workspaceAPI, loadWorkspace]);

  const closeWorkspace = useCallback(async () => {
    if (!workspaceAPI) return;

    try {
      await workspaceAPI.close();
      setWorkspace(null);
      setGraphs([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close workspace');
      console.error('Error closing workspace:', err);
    }
  }, [workspaceAPI]);

  const refreshGraphs = useCallback(async () => {
    if (!workspaceAPI || !workspace) return;

    try {
      const graphList = await workspaceAPI.listGraphs();
      setGraphs(graphList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh graphs');
      console.error('Error refreshing graphs:', err);
    }
  }, [workspaceAPI, workspace]);

  const saveGraph = useCallback(
    async (graphId: string, graphData: unknown) => {
      if (!workspaceAPI) {
        throw new Error('Workspace API not available');
      }

      try {
        const success = await workspaceAPI.saveGraph(graphId, graphData);
        if (success) {
          await refreshGraphs();
        }
        return success;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save graph');
        throw err;
      }
    },
    [workspaceAPI, refreshGraphs]
  );

  const loadGraph = useCallback(
    async (graphId: string) => {
      if (!workspaceAPI) {
        throw new Error('Workspace API not available');
      }

      try {
        return await workspaceAPI.loadGraph(graphId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load graph');
        throw err;
      }
    },
    [workspaceAPI]
  );

  const deleteGraph = useCallback(
    async (graphId: string) => {
      if (!workspaceAPI) {
        throw new Error('Workspace API not available');
      }

      try {
        const success = await workspaceAPI.deleteGraph(graphId);
        if (success) {
          await refreshGraphs();
        }
        return success;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete graph');
        throw err;
      }
    },
    [workspaceAPI, refreshGraphs]
  );

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  return {
    workspace,
    graphs,
    loading,
    error,
    isElectronEnv,
    hasWorkspace: workspace !== null,

    selectWorkspace,
    closeWorkspace,
    refreshGraphs,
    saveGraph,
    loadGraph,
    deleteGraph,
    reload: loadWorkspace,
  };
}

export function useWorkspaceAvailable() {
  const { isElectronEnv, hasWorkspace } = useWorkspace();
  return isElectronEnv && hasWorkspace;
}
