import { useEffect, useRef } from 'react';
import { useGraphStore } from '@/store/graphStore';
import { useHistoryStore } from '@/store/historyStore';

export const useGraphHistory = (debounceMs: number = 500) => {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const pushState = useHistoryStore((state) => state.pushState);

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const previousCountRef = useRef({ nodeCount: 0, edgeCount: 0 });

  useEffect(() => {
    const currentCounts = { nodeCount: nodes.length, edgeCount: edges.length };

    const structureChanged =
      currentCounts.nodeCount !== previousCountRef.current.nodeCount ||
      currentCounts.edgeCount !== previousCountRef.current.edgeCount;

    if (structureChanged) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (nodes.length > 0 || edges.length > 0) {
          pushState(nodes, edges);
          previousCountRef.current = currentCounts;
        }
      }, debounceMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [nodes, edges, pushState, debounceMs]);
};

export const useManualHistorySave = () => {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const pushState = useHistoryStore((state) => state.pushState);

  return () => {
    pushState(nodes, edges);
  };
};
