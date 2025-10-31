import { useEffect, useRef } from 'react';
import { useGraphStore } from '@/store/graphStore';
import { useWorkspace } from '@/contexts/WorkspaceContext';

const AUTOSAVE_DELAY = 3000;

let isLoadingGraph = false;

export function setGraphLoading(loading: boolean) {
  isLoadingGraph = loading;
}

export function useGraphAutosave() {
  const { nodes, edges, currentGraph } = useGraphStore();
  const { saveGraph, workspace } = useWorkspace();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<string>('');
  const isSavingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!workspace || !currentGraph || !saveGraph || isSavingRef.current || isLoadingGraph) {
      return;
    }

    const currentState = JSON.stringify({ nodes, edges });

    if (currentState === lastSaveRef.current) {
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current || isLoadingGraph) return;

      isSavingRef.current = true;
      try {
        await saveGraph(currentGraph.id, {
          nodes,
          edges,
          name: currentGraph.name,
          description: currentGraph.description,
          repository_owner: currentGraph.repository_owner,
          repository_name: currentGraph.repository_name,
          repository_branch: currentGraph.repository_branch,
          sync_enabled: currentGraph.sync_enabled,
        });
        lastSaveRef.current = currentState;
      } catch (error) {
        console.error('Error auto-saving graph:', error);
      } finally {
        isSavingRef.current = false;
      }
    }, AUTOSAVE_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [nodes, edges, currentGraph, saveGraph, workspace]);
}
