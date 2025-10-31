import type { WorkspaceInfo, GraphMetadata, FileItem, FileContent } from './electron';
import { STORAGE_KEYS } from '@/constants';

const WORKSPACE_KEY = STORAGE_KEYS.WORKSPACE;
const GRAPHS_KEY = STORAGE_KEYS.GRAPHS;
const FILES_KEY = STORAGE_KEYS.FILES;

interface GraphData {
  id: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
  nodes?: unknown[];
  edges?: unknown[];
  [key: string]: unknown;
}

export interface VirtualWorkspace {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  graphs: Record<string, GraphData>;
  files: Record<string, FileContent>;
  settings: {
    autoSave: boolean;
    backupOnSave: boolean;
    maxBackups: number;
  };
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createDefaultWorkspace = (): VirtualWorkspace => ({
  id: generateId(),
  name: 'My Workspace',
  path: '/virtual/workspace',
  createdAt: new Date().toISOString(),
  graphs: {},
  files: {},
  settings: {
    autoSave: true,
    backupOnSave: true,
    maxBackups: 5,
  },
});

export class VirtualWorkspaceManager {
  private workspace: VirtualWorkspace | null = null;

  constructor() {
    this.loadWorkspace();
  }

  private loadWorkspace(): void {
    try {
      const stored = localStorage.getItem(WORKSPACE_KEY);
      if (stored) {
        this.workspace = JSON.parse(stored);
      } else {
        this.workspace = createDefaultWorkspace();
        this.saveWorkspace();
      }
    } catch (error) {
      console.error('Error loading virtual workspace:', error);
      this.workspace = createDefaultWorkspace();
      this.saveWorkspace();
    }
  }

  private saveWorkspace(): void {
    if (this.workspace) {
      try {
        localStorage.setItem(WORKSPACE_KEY, JSON.stringify(this.workspace));
      } catch (error) {
        console.error('Error saving virtual workspace:', error);
      }
    }
  }

  async getCurrent(): Promise<WorkspaceInfo | null> {
    if (!this.workspace) return null;

    return {
      path: this.workspace.path,
      name: this.workspace.name,
      graphCount: Object.keys(this.workspace.graphs).length,
      createdAt: this.workspace.createdAt,
      settings: this.workspace.settings,
    };
  }

  async select(): Promise<{ path: string; name: string } | null> {
    if (!this.workspace) {
      this.workspace = createDefaultWorkspace();
      this.saveWorkspace();
    }

    return {
      path: this.workspace.path,
      name: this.workspace.name,
    };
  }

  async close(): Promise<boolean> {
    this.saveWorkspace();
    return true;
  }

  async listGraphs(): Promise<GraphMetadata[]> {
    if (!this.workspace) return [];

    return Object.entries(this.workspace.graphs).map(([id, graphData]) => ({
      id,
      name: graphData.name || `Graph ${id}`,
      createdAt: graphData.createdAt || new Date().toISOString(),
      updatedAt: graphData.updatedAt || new Date().toISOString(),
      nodeCount: graphData.nodes?.length || 0,
    }));
  }

  async saveGraph(graphId: string, graphData: unknown): Promise<boolean> {
    if (!this.workspace) return false;

    try {
      const graphDataWithMeta: GraphData = {
        ...(typeof graphData === 'object' && graphData !== null
          ? (graphData as Record<string, unknown>)
          : {}),
        id: graphId,
        updatedAt: new Date().toISOString(),
        createdAt: this.workspace.graphs[graphId]?.createdAt || new Date().toISOString(),
      };

      this.workspace.graphs[graphId] = graphDataWithMeta;
      this.saveWorkspace();
      return true;
    } catch (error) {
      console.error('Error saving graph:', error);
      return false;
    }
  }

  async loadGraph(graphId: string): Promise<unknown> {
    if (!this.workspace || !this.workspace.graphs[graphId]) {
      throw new Error(`Graph ${graphId} not found`);
    }

    return this.workspace.graphs[graphId];
  }

  async deleteGraph(graphId: string): Promise<boolean> {
    if (!this.workspace) return false;

    try {
      delete this.workspace.graphs[graphId];
      this.saveWorkspace();
      return true;
    } catch (error) {
      console.error('Error deleting graph:', error);
      return false;
    }
  }

  async listFiles(_dirPath?: string): Promise<FileItem[]> {
    if (!this.workspace) return [];

    const files = Object.keys(this.workspace.files).map((path) => {
      const file = this.workspace!.files[path];
      return {
        name: file.name,
        path: file.path,
        isDirectory: false,
        isFile: true,
      };
    });

    const virtualDirs = [
      { name: 'docs', path: '/virtual/workspace/docs', isDirectory: true, isFile: false },
      { name: 'src', path: '/virtual/workspace/src', isDirectory: true, isFile: false },
      { name: 'assets', path: '/virtual/workspace/assets', isDirectory: true, isFile: false },
    ];

    return [...virtualDirs, ...files];
  }

  async readFile(filePath: string): Promise<FileContent> {
    if (!this.workspace || !this.workspace.files[filePath]) {
      throw new Error(`File ${filePath} not found`);
    }

    return this.workspace.files[filePath];
  }

  async writeFile(
    filePath: string,
    content: string
  ): Promise<{ success: boolean; path: string; size: number }> {
    if (!this.workspace) {
      return { success: false, path: filePath, size: 0 };
    }

    try {
      const fileName = filePath.split('/').pop() || 'untitled';
      const extension = fileName.includes('.') ? fileName.split('.').pop() || '' : '';

      const fileContent: FileContent = {
        content,
        size: content.length,
        path: filePath,
        name: fileName,
        extension,
      };

      this.workspace.files[filePath] = fileContent;
      this.saveWorkspace();

      return {
        success: true,
        path: filePath,
        size: content.length,
      };
    } catch (error) {
      console.error('Error writing file:', error);
      return { success: false, path: filePath, size: 0 };
    }
  }

  async exportWorkspace(): Promise<string> {
    if (!this.workspace) return '{}';
    return JSON.stringify(this.workspace, null, 2);
  }

  async importWorkspace(data: string): Promise<boolean> {
    try {
      const imported = JSON.parse(data) as VirtualWorkspace;
      this.workspace = imported;
      this.saveWorkspace();
      return true;
    } catch (error) {
      console.error('Error importing workspace:', error);
      return false;
    }
  }

  async clearWorkspace(): Promise<boolean> {
    try {
      this.workspace = createDefaultWorkspace();
      this.saveWorkspace();
      localStorage.removeItem(GRAPHS_KEY);
      localStorage.removeItem(FILES_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing workspace:', error);
      return false;
    }
  }
}

export const virtualWorkspaceManager = new VirtualWorkspaceManager();
