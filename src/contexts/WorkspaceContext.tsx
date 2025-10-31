import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  isElectron,
  getWorkspaceAPI,
  type WorkspaceInfo,
  type GraphMetadata,
} from '@/lib/electron';
import { virtualWorkspaceManager } from '@/lib/virtualWorkspace';
import { useGraphStore } from '@/store/graphStore';

interface WorkspaceContextType {
  workspace: WorkspaceInfo | null;
  graphs: GraphMetadata[];
  loading: boolean;
  error: string | null;
  isElectronEnv: boolean;
  selectWorkspace: () => Promise<{ path: string; name: string } | null>;
  closeWorkspace: () => Promise<void>;
  refreshGraphs: () => Promise<void>;
  saveGraph: (graphId: string, graphData: unknown) => Promise<boolean>;
  loadGraph: (graphId: string) => Promise<unknown>;
  deleteGraph: (graphId: string) => Promise<boolean>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [graphs, setGraphs] = useState<GraphMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceAPI = getWorkspaceAPI();
  const isElectronEnv = isElectron();

  const { clearGraphView, setCurrentGraph, setLastOpenedGraph, getLastOpenedGraph } =
    useGraphStore();

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isElectronEnv && workspaceAPI) {
        const current = await workspaceAPI.getCurrent();
        setWorkspace(current);

        if (current) {
          const graphList = await workspaceAPI.listGraphs();
          setGraphs(graphList);

          if (graphList.length > 0) {
            const lastGraphId = getLastOpenedGraph(current.path);
            let graphToLoad = graphList.find((g) => g.id === lastGraphId);

            if (!graphToLoad) {
              graphToLoad = graphList[0];
            }

            try {
              const graphData: unknown = await workspaceAPI.loadGraph(graphToLoad.id);

              setCurrentGraph({
                id: graphToLoad.id,
                name: ((graphData as Record<string, unknown>).name as string) || graphToLoad.name,
                description: ((graphData as Record<string, unknown>).description as string) || '',
                repository_owner: (graphData as Record<string, unknown>).repository_owner as string,
                repository_name: (graphData as Record<string, unknown>).repository_name as string,
                repository_branch: (graphData as Record<string, unknown>)
                  .repository_branch as string,
                sync_enabled: (graphData as Record<string, unknown>).sync_enabled as boolean,
              });

              const { loadGraph: loadGraphData } = useGraphStore.getState();
              loadGraphData(JSON.stringify(graphData));

              setLastOpenedGraph(current.path, graphToLoad.id);
            } catch (err) {
              console.error('Error loading graph:', err);
            }
          }
        } else {
          setGraphs([]);
        }
      } else {
        const current = await virtualWorkspaceManager.getCurrent();
        setWorkspace(current);

        if (current) {
          const graphList = await virtualWorkspaceManager.listGraphs();
          setGraphs(graphList);

          if (graphList.length > 0) {
            const lastGraphId = getLastOpenedGraph(current.path);
            let graphToLoad = graphList.find((g) => g.id === lastGraphId);

            if (!graphToLoad) {
              graphToLoad = graphList[0];
            }

            try {
              const graphData: unknown = await virtualWorkspaceManager.loadGraph(graphToLoad.id);

              setCurrentGraph({
                id: graphToLoad.id,
                name: ((graphData as Record<string, unknown>).name as string) || graphToLoad.name,
                description: ((graphData as Record<string, unknown>).description as string) || '',
                repository_owner: (graphData as Record<string, unknown>).repository_owner as string,
                repository_name: (graphData as Record<string, unknown>).repository_name as string,
                repository_branch: (graphData as Record<string, unknown>)
                  .repository_branch as string,
                sync_enabled: (graphData as Record<string, unknown>).sync_enabled as boolean,
              });

              const { loadGraph: loadGraphData } = useGraphStore.getState();
              loadGraphData(JSON.stringify(graphData));

              setLastOpenedGraph(current.path, graphToLoad.id);
            } catch (err) {
              console.error('Error loading graph:', err);
            }
          }
        } else {
          setGraphs([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace');
      console.error('Error loading workspace:', err);
    } finally {
      setLoading(false);
    }
  }, [isElectronEnv, workspaceAPI, getLastOpenedGraph, setCurrentGraph, setLastOpenedGraph]);

  const selectWorkspace = useCallback(async () => {
    try {
      setError(null);

      if (isElectronEnv && workspaceAPI) {
        const result = await workspaceAPI.select();

        if (result) {
          const graphList = await workspaceAPI.listGraphs();
          setWorkspace({
            ...result,
            graphCount: graphList.length,
          });
          setGraphs(graphList);

          if (graphList.length > 0) {
            const lastGraphId = useGraphStore.getState().getLastOpenedGraph(result.path);
            let graphToLoad = graphList.find((g) => g.id === lastGraphId);

            if (!graphToLoad) {
              graphToLoad = graphList[0];
            }

            try {
              const graphData: unknown = await workspaceAPI.loadGraph(graphToLoad.id);

              setCurrentGraph({
                id: graphToLoad.id,
                name: ((graphData as Record<string, unknown>).name as string) || graphToLoad.name,
                description: ((graphData as Record<string, unknown>).description as string) || '',
                repository_owner: (graphData as Record<string, unknown>).repository_owner as string,
                repository_name: (graphData as Record<string, unknown>).repository_name as string,
                repository_branch: (graphData as Record<string, unknown>)
                  .repository_branch as string,
                sync_enabled: (graphData as Record<string, unknown>).sync_enabled as boolean,
              });

              const { loadGraph: loadGraphData } = useGraphStore.getState();
              loadGraphData(JSON.stringify(graphData));

              useGraphStore.getState().setLastOpenedGraph(result.path, graphToLoad.id);
            } catch (err) {
              console.error('Error loading graph:', err);
            }
          }
        }

        return result;
      } else {
        const result = await virtualWorkspaceManager.select();

        if (result) {
          const graphList = await virtualWorkspaceManager.listGraphs();
          setWorkspace({
            ...result,
            graphCount: graphList.length,
          });
          setGraphs(graphList);

          if (graphList.length > 0) {
            const lastGraphId = useGraphStore.getState().getLastOpenedGraph(result.path);
            let graphToLoad = graphList.find((g) => g.id === lastGraphId);

            if (!graphToLoad) {
              graphToLoad = graphList[0];
            }

            try {
              const graphData: unknown = await virtualWorkspaceManager.loadGraph(graphToLoad.id);

              setCurrentGraph({
                id: graphToLoad.id,
                name: ((graphData as Record<string, unknown>).name as string) || graphToLoad.name,
                description: ((graphData as Record<string, unknown>).description as string) || '',
                repository_owner: (graphData as Record<string, unknown>).repository_owner as string,
                repository_name: (graphData as Record<string, unknown>).repository_name as string,
                repository_branch: (graphData as Record<string, unknown>)
                  .repository_branch as string,
                sync_enabled: (graphData as Record<string, unknown>).sync_enabled as boolean,
              });

              const { loadGraph: loadGraphData } = useGraphStore.getState();
              loadGraphData(JSON.stringify(graphData));

              useGraphStore.getState().setLastOpenedGraph(result.path, graphToLoad.id);
            } catch (err) {
              console.error('Error loading graph:', err);
            }
          }
        }

        return result;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select workspace');
      console.error('Error selecting workspace:', err);
      return null;
    }
  }, [workspaceAPI, setCurrentGraph, isElectronEnv]);

  const closeWorkspace = useCallback(async () => {
    try {
      if (isElectronEnv && workspaceAPI) {
        await workspaceAPI.close();
      } else {
        await virtualWorkspaceManager.close();
      }

      setWorkspace(null);
      setGraphs([]);

      clearGraphView();
      setCurrentGraph(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close workspace');
      console.error('Error closing workspace:', err);
    }
  }, [workspaceAPI, clearGraphView, setCurrentGraph, isElectronEnv]);

  const refreshGraphs = useCallback(async () => {
    if (!workspace) return;

    try {
      let graphList: GraphMetadata[];

      if (isElectronEnv && workspaceAPI) {
        graphList = await workspaceAPI.listGraphs();
      } else {
        graphList = await virtualWorkspaceManager.listGraphs();
      }

      setGraphs(graphList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh graphs');
      console.error('Error refreshing graphs:', err);
    }
  }, [workspaceAPI, workspace, isElectronEnv]);

  const saveGraph = useCallback(
    async (graphId: string, graphData: unknown) => {
      try {
        let success: boolean;

        if (isElectronEnv && workspaceAPI) {
          success = await workspaceAPI.saveGraph(graphId, graphData);
        } else {
          success = await virtualWorkspaceManager.saveGraph(graphId, graphData);
        }

        if (success) {
          await refreshGraphs();
        }
        return success;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save graph');
        throw err;
      }
    },
    [workspaceAPI, refreshGraphs, isElectronEnv]
  );

  const loadGraph = useCallback(
    async (graphId: string) => {
      try {
        if (isElectronEnv && workspaceAPI) {
          return await workspaceAPI.loadGraph(graphId);
        } else {
          return await virtualWorkspaceManager.loadGraph(graphId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load graph');
        throw err;
      }
    },
    [workspaceAPI, isElectronEnv]
  );

  const deleteGraph = useCallback(
    async (graphId: string) => {
      try {
        let success: boolean;

        if (isElectronEnv && workspaceAPI) {
          success = await workspaceAPI.deleteGraph(graphId);
        } else {
          success = await virtualWorkspaceManager.deleteGraph(graphId);
        }

        if (success) {
          await refreshGraphs();
        }
        return success;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete graph');
        throw err;
      }
    },
    [workspaceAPI, refreshGraphs, isElectronEnv]
  );

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const value: WorkspaceContextType = {
    workspace,
    graphs,
    loading,
    error,
    isElectronEnv,
    selectWorkspace,
    closeWorkspace,
    refreshGraphs,
    saveGraph,
    loadGraph,
    deleteGraph,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}
