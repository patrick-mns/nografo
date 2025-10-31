import type { FileOperations } from './applier';

export class ElectronFileOperations implements FileOperations {
  async readFile(filepath: string): Promise<string> {
    if (!window.electron?.git) {
      throw new Error('Electron git manager not available');
    }

    const result = await window.electron.git.readFile(filepath);
    if (!result.success) {
      throw new Error(result.error || 'Failed to read file');
    }
    return result.content || '';
  }

  async writeFile(filepath: string, content: string): Promise<void> {
    if (!window.electron?.git) {
      throw new Error('Electron git manager not available');
    }

    const result = await window.electron.git.createFile(filepath, content);
    if (!result.success) {
      throw new Error(result.error || 'Failed to write file');
    }
  }

  async deleteFile(filepath: string): Promise<void> {
    if (!window.electron?.git) {
      throw new Error('Electron git manager not available');
    }

    const result = await window.electron.git.deleteFile(filepath);
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete file');
    }
  }

  async fileExists(filepath: string): Promise<boolean> {
    if (!window.electron?.git) {
      return false;
    }

    try {
      await this.readFile(filepath);
      return true;
    } catch {
      return false;
    }
  }

  async createBackup(filepath: string): Promise<string> {
    if (!window.electron?.git) {
      throw new Error('Electron git manager not available');
    }

    const backupPath = `${filepath}.backup.${Date.now()}`;
    return backupPath;
  }
}

export function createFileOperations(): FileOperations {
  return new ElectronFileOperations();
}

export function createAutoFileOperations(): FileOperations {
  return new ElectronFileOperations();
}
