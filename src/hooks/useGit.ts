import { useState, useEffect, useCallback } from 'react';

export interface TerminalLog {
  message: string;
  type: 'info' | 'success' | 'error' | 'warn' | 'command';
  timestamp: string;
}

export interface UseGitReturn {
  logs: TerminalLog[];
  isInitialized: boolean;
  workspacePath: string | null;
  currentBranch: string | null;

  initRepo: (path: string) => Promise<void>;
  createFile: (filepath: string, content: string) => Promise<void>;
  readFile: (filepath: string) => Promise<string>;
  updateFile: (filepath: string, content: string) => Promise<void>;
  deleteFile: (filepath: string) => Promise<void>;
  listFiles: (directory?: string) => Promise<any>;
  applyDiff: (filepath: string, oldContent: string, newContent: string) => Promise<void>;
  commit: (message: string, author?: string) => Promise<void>;
  getStatus: () => Promise<any>;
  getCurrentBranch: () => Promise<string | null>;
  getLog: (limit?: number) => Promise<any>;
  clearLogs: () => void;
  addLog: (message: string, type?: TerminalLog['type']) => void;
}

export const useGit = (): UseGitReturn => {
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);

  const addLog = useCallback((message: string, type: TerminalLog['type'] = 'info') => {
    const log: TerminalLog = {
      message,
      type,
      timestamp: new Date().toISOString(),
    };
    setLogs((prev) => [...prev, log]);
  }, []);

  useEffect(() => {
    if (!window.electron?.git) return;

    const handleTerminalOutput = (data: any) => {
      const log: TerminalLog = {
        message: data.message,
        type: data.type || 'info',
        timestamp: data.timestamp || new Date().toISOString(),
      };
      setLogs((prev) => [...prev, log]);
    };

    window.electron.git.onTerminalOutput?.(handleTerminalOutput);
  }, []);

  const initRepo = useCallback(
    async (path: string) => {
      try {
        addLog(`Initializing repository at ${path}...`, 'command');

        const result = await window.electron!.git.init(path);

        if (result.success) {
          setIsInitialized(true);
          setWorkspacePath(path);
          addLog('✅ Repository initialized successfully', 'success');
        } else {
          addLog(`❌ Failed to initialize: ${result.error}`, 'error');
          throw new Error(result.error);
        }
      } catch (error) {
        addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        throw error;
      }
    },
    [addLog]
  );

  const createFile = useCallback(
    async (filepath: string, content: string) => {
      try {
        addLog(`Creating file: ${filepath}`, 'command');

        const result = await window.electron!.git.createFile(filepath, content);

        if (result.success) {
          addLog(`✅ File created: ${filepath}`, 'success');
        } else {
          addLog(`❌ Failed to create file: ${result.error}`, 'error');
          throw new Error(result.error);
        }
      } catch (error) {
        addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        throw error;
      }
    },
    [addLog]
  );

  const readFile = useCallback(
    async (filepath: string): Promise<string> => {
      try {
        const result = await window.electron!.git.readFile(filepath);

        if (result.success) {
          return result.content;
        } else {
          addLog(`❌ Failed to read file: ${result.error}`, 'error');
          throw new Error(result.error);
        }
      } catch (error) {
        addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        throw error;
      }
    },
    [addLog]
  );

  const updateFile = useCallback(
    async (filepath: string, content: string) => {
      try {
        addLog(`Updating file: ${filepath}`, 'command');

        const result = await window.electron!.git.updateFile(filepath, content);

        if (result.success) {
          addLog(`✅ File updated: ${filepath}`, 'success');
        } else {
          addLog(`❌ Failed to update file: ${result.error}`, 'error');
          throw new Error(result.error);
        }
      } catch (error) {
        addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        throw error;
      }
    },
    [addLog]
  );

  const deleteFile = useCallback(
    async (filepath: string) => {
      try {
        addLog(`Deleting file: ${filepath}`, 'command');

        const result = await window.electron!.git.deleteFile(filepath);

        if (result.success) {
          addLog(`✅ File deleted: ${filepath}`, 'success');
        } else {
          addLog(`❌ Failed to delete file: ${result.error}`, 'error');
          throw new Error(result.error);
        }
      } catch (error) {
        addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        throw error;
      }
    },
    [addLog]
  );

  const listFiles = useCallback(
    async (directory: string = '.') => {
      try {
        const result = await window.electron!.git.listFiles(directory);

        if (result.success) {
          return result;
        } else {
          addLog(`❌ Failed to list files: ${result.error}`, 'error');
          throw new Error(result.error);
        }
      } catch (error) {
        addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        throw error;
      }
    },
    [addLog]
  );

  const applyDiff = useCallback(
    async (filepath: string, oldContent: string, newContent: string) => {
      try {
        addLog(`Applying diff to: ${filepath}`, 'command');

        const result = await window.electron!.git.applyDiff(filepath, oldContent, newContent);

        if (result.success) {
          addLog(`✅ Diff applied: ${filepath}`, 'success');
        } else {
          addLog(`❌ Failed to apply diff: ${result.error}`, 'error');
          throw new Error(result.error);
        }
      } catch (error) {
        addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        throw error;
      }
    },
    [addLog]
  );

  const commit = useCallback(
    async (message: string, author: string = 'AI Assistant') => {
      try {
        addLog(`Creating commit: "${message}"`, 'command');

        await window.electron!.git.add(['.']);

        const result = await window.electron!.git.commit(message, author);

        if (result.success) {
          addLog(`✅ Commit created: ${result.sha?.substring(0, 7)}`, 'success');
        } else {
          addLog(`❌ Failed to commit: ${result.error}`, 'error');
          throw new Error(result.error);
        }
      } catch (error) {
        addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        throw error;
      }
    },
    [addLog]
  );

  const getStatus = useCallback(async () => {
    try {
      const result = await window.electron!.git.status();
      return result;
    } catch (error) {
      addLog(
        `❌ Error getting status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
      throw error;
    }
  }, [addLog]);

  const getCurrentBranch = useCallback(async () => {
    try {
      const branch = await window.electron!.git.currentBranch();
      if (branch) {
        setCurrentBranch(branch);
      }
      return branch;
    } catch (error) {
      addLog(
        `❌ Error getting current branch: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
      return null;
    }
  }, [addLog]);

  const getLog = useCallback(
    async (limit: number = 10) => {
      try {
        const result = await window.electron!.git.log(limit);
        return result;
      } catch (error) {
        addLog(
          `❌ Error getting log: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'error'
        );
        throw error;
      }
    },
    [addLog]
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    isInitialized,
    workspacePath,
    currentBranch,
    initRepo,
    createFile,
    readFile,
    updateFile,
    deleteFile,
    listFiles,
    applyDiff,
    commit,
    getStatus,
    getCurrentBranch,
    getLog,
    clearLogs,
    addLog,
  };
};

export default useGit;
