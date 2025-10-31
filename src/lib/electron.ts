export interface WorkspaceInfo {
  path: string;
  name: string;
  graphCount: number;
  createdAt?: string;
  settings?: {
    autoSave: boolean;
    backupOnSave: boolean;
    maxBackups: number;
  };
}

export interface GraphMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
}

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
}

export interface FileContent {
  content: string;
  size: number;
  path: string;
  name: string;
  extension: string;
}

export interface AttachedFile {
  path: string;
  name: string;
  attachedAt: string;
}

declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      isElectron: boolean;
      send: (channel: string, data: unknown) => void;
      receive: (channel: string, func: (...args: unknown[]) => void) => void;
      getVersion: () => string;
      workspace: {
        select: () => Promise<{ path: string; name: string } | null>;
        getCurrent: () => Promise<WorkspaceInfo | null>;
        close: () => Promise<boolean>;
        listGraphs: () => Promise<GraphMetadata[]>;
        saveGraph: (graphId: string, graphData: unknown) => Promise<boolean>;
        loadGraph: (graphId: string) => Promise<unknown>;
        deleteGraph: (graphId: string) => Promise<boolean>;
        listFiles: (dirPath?: string) => Promise<FileItem[]>;
        readFile: (filePath: string) => Promise<FileContent>;
        writeFile: (
          filePath: string,
          content: string
        ) => Promise<{ success: boolean; path: string; size: number }>;
      };
    };
  }
}

export const isElectron = (): boolean => {
  return !!(window && window.electronAPI && window.electronAPI.isElectron);
};

export const getPlatform = (): string => {
  if (isElectron()) {
    return window.electronAPI?.platform || 'unknown';
  }
  return 'web';
};

export const isMac = (): boolean => {
  return getPlatform() === 'darwin';
};

export const isWindows = (): boolean => {
  return getPlatform() === 'win32';
};

export const isLinux = (): boolean => {
  return getPlatform() === 'linux';
};

export const getElectronVersion = (): string | null => {
  if (isElectron()) {
    return window.electronAPI?.getVersion() || null;
  }
  return null;
};

export const sendToElectron = (channel: string, data?: unknown): void => {
  if (isElectron() && window.electronAPI) {
    window.electronAPI.send(channel, data);
  }
};

export const receiveFromElectron = (
  channel: string,
  callback: (...args: unknown[]) => void
): void => {
  if (isElectron() && window.electronAPI) {
    window.electronAPI.receive(channel, callback);
  }
};

export const useElectron = () => {
  return {
    isElectron: isElectron(),
    platform: getPlatform(),
    isMac: isMac(),
    isWindows: isWindows(),
    isLinux: isLinux(),
    version: getElectronVersion(),
    send: sendToElectron,
    receive: receiveFromElectron,
    workspace: getWorkspaceAPI(),
  };
};

export const getWorkspaceAPI = () => {
  if (isElectron() && window.electronAPI?.workspace) {
    return window.electronAPI.workspace;
  }
  return null;
};

export const hasWorkspace = async (): Promise<boolean> => {
  const workspace = getWorkspaceAPI();
  if (!workspace) return false;

  try {
    const current = await workspace.getCurrent();
    return current !== null;
  } catch {
    return false;
  }
};

export const selectWorkspace = async (): Promise<{ path: string; name: string } | null> => {
  const workspace = getWorkspaceAPI();
  if (!workspace) {
    console.warn('Workspace API not available - not running in Electron');
    return null;
  }

  return await workspace.select();
};

export const saveGraphToWorkspace = async (
  graphId: string,
  graphData: unknown
): Promise<boolean> => {
  const workspace = getWorkspaceAPI();
  if (!workspace) {
    console.warn('Workspace API not available - falling back to cloud save');
    return false;
  }

  try {
    return await workspace.saveGraph(graphId, graphData);
  } catch (error) {
    console.error('Error saving graph to workspace:', error);
    return false;
  }
};

export const loadGraphFromWorkspace = async (graphId: string): Promise<unknown | null> => {
  const workspace = getWorkspaceAPI();
  if (!workspace) {
    console.warn('Workspace API not available - falling back to cloud load');
    return null;
  }

  try {
    return await workspace.loadGraph(graphId);
  } catch (error) {
    console.error('Error loading graph from workspace:', error);
    return null;
  }
};
