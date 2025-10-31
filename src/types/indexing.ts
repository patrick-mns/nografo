export interface IndexingSearchResult {
  path: string;
  fullPath: string;
  text: string;
  chunkIndex: number;
  score: number;
}

export interface IndexingStats {
  enabled: boolean;
  isIndexing: boolean;
  isInitialized: boolean;
  documentsCount: number;
  chunksCount: number;
  indexPath: string;
}

export interface IndexingAPI {
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
}
