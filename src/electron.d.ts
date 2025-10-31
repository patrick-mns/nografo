import type { IndexingAPI } from './types/indexing';

interface Window {
  electron?: {
    git?: {
      init: (path: string) => Promise<any>;
      createFile: (filepath: string, content: string) => Promise<any>;
      readFile: (filepath: string) => Promise<any>;
      updateFile: (filepath: string, content: string) => Promise<any>;
      deleteFile: (filepath: string) => Promise<any>;
      listFiles: (directory?: string) => Promise<any>;
      add: (files: string[]) => Promise<any>;
      commit: (message: string, author?: any) => Promise<any>;
      status: () => Promise<any>;
      currentBranch: () => Promise<string | null>;
      log: (limit?: number) => Promise<any>;
      applyDiff: (filepath: string, oldContent: string, newContent: string) => Promise<any>;
      onTerminalOutput: (callback: (data: any) => void) => void;
    };
    indexing?: IndexingAPI;
  };
}
