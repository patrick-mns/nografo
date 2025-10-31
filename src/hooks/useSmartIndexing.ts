import { useEffect, useCallback, useState } from 'react';
import { useDeveloperSettingsStore } from '@/store/developerSettingsStore';
import type { IndexingSearchResult, IndexingStats } from '@/types/indexing';

declare global {
  interface Window {
    electron?: {
      indexing?: {
        initialize: (
          workspacePath: string,
          storagePath: string
        ) => Promise<{ success: boolean; error?: string }>;
        search: (
          query: string,
          k?: number
        ) => Promise<{ success: boolean; results?: IndexingSearchResult[]; error?: string }>;
        stats: () => Promise<{ success: boolean; stats?: IndexingStats; error?: string }>;
        setEnabled: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
        reindex: () => Promise<{ success: boolean; error?: string }>;
        clear: () => Promise<{ success: boolean; error?: string }>;
      };
    };
  }
}

export function useSmartIndexing() {
  const { isSmartIndexingEnabled } = useDeveloperSettingsStore();
  const [stats, setStats] = useState<IndexingStats | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initialize = useCallback(async (workspacePath: string, storagePath: string) => {
    if (!window.electron?.indexing) {
      console.warn('[SmartIndexing] API not available');
      return false;
    }

    try {
      const result = await window.electron.indexing.initialize(workspacePath, storagePath);
      if (result.success) {
        setIsInitialized(true);

        await refreshStats();
        return true;
      } else {
        console.error('[SmartIndexing] Initialization failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('[SmartIndexing] Initialization error:', error);
      return false;
    }
  }, []);

  const search = useCallback(
    async (query: string, k: number = 5): Promise<IndexingSearchResult[]> => {
      if (!window.electron?.indexing) {
        console.warn('[SmartIndexing] API not available');
        return [];
      }

      if (!isSmartIndexingEnabled) {
        return [];
      }

      try {
        const result = await window.electron.indexing.search(query, k);
        if (result.success && result.results) {
          return result.results;
        } else {
          console.error('[SmartIndexing] Search failed:', result.error);
          return [];
        }
      } catch (error) {
        console.error('[SmartIndexing] Search error:', error);
        return [];
      }
    },
    [isSmartIndexingEnabled]
  );

  const refreshStats = useCallback(async () => {
    if (!window.electron?.indexing) return;

    try {
      const result = await window.electron.indexing.stats();
      if (result.success && result.stats) {
        setStats(result.stats);

        setIsInitialized(result.stats.isInitialized || false);
      }
    } catch (error) {
      console.error('[SmartIndexing] Failed to get stats:', error);
    }
  }, []);

  const reindex = useCallback(async () => {
    if (!window.electron?.indexing) {
      console.warn('[SmartIndexing] API not available');
      return false;
    }

    try {
      const result = await window.electron.indexing.reindex();
      if (result.success) {
        await refreshStats();
        return true;
      } else {
        console.error('[SmartIndexing] Reindex failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('[SmartIndexing] Reindex error:', error);
      return false;
    }
  }, [refreshStats]);

  const clearIndex = useCallback(async () => {
    if (!window.electron?.indexing) {
      console.warn('[SmartIndexing] API not available');
      return false;
    }

    try {
      const result = await window.electron.indexing.clear();
      if (result.success) {
        await refreshStats();
        return true;
      } else {
        console.error('[SmartIndexing] Clear failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('[SmartIndexing] Clear error:', error);
      return false;
    }
  }, [refreshStats]);

  useEffect(() => {
    if (!window.electron?.indexing || !isInitialized) return;

    const syncEnabled = async () => {
      try {
        if (window.electron?.indexing) {
          await window.electron.indexing.setEnabled(isSmartIndexingEnabled);
          await refreshStats();
        }
      } catch (error) {
        console.error('[SmartIndexing] Failed to sync enabled state:', error);
      }
    };

    syncEnabled();
  }, [isSmartIndexingEnabled, isInitialized, refreshStats]);

  useEffect(() => {
    if (!window.electron?.indexing) return;

    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    if (!isInitialized || !isSmartIndexingEnabled) return;

    const interval = setInterval(() => {
      refreshStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [isInitialized, isSmartIndexingEnabled, refreshStats]);

  return {
    isAvailable: !!window.electron?.indexing,
    isInitialized,
    isEnabled: isSmartIndexingEnabled,
    stats,
    initialize,
    search,
    reindex,
    clearIndex,
    refreshStats,
  };
}

export function useSmartContext(query: string | null, enabled: boolean = true) {
  const { search, isEnabled } = useSmartIndexing();
  const [context, setContext] = useState<IndexingSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query || !enabled || !isEnabled) {
      setContext([]);
      return;
    }

    const fetchContext = async () => {
      setIsLoading(true);
      try {
        const results = await search(query, 5);
        setContext(results);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchContext, 500);
    return () => clearTimeout(timeoutId);
  }, [query, enabled, isEnabled, search]);

  return {
    context,
    isLoading,
  };
}
