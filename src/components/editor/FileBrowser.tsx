import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import {
  FileText,
  FolderOpen,
  GitBranch,
  GitCommit,
  Plus,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  path: string;
}

interface GitStatus {
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
}

interface FileBrowserProps {
  workspacePath: string | null;
  onFileSelect?: (filepath: string) => void;
  onCreateFile?: (filepath: string, content: string) => void;
  onCommit?: (message: string) => void;
  className?: string;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
  workspacePath,
  onFileSelect,
  onCreateFile,
  onCommit,
  className = '',
}) => {
  const [currentPath, setCurrentPath] = useState('.');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [dirs, setDirs] = useState<FileItem[]>([]);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateFile, setShowCreateFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [commitMessage, setCommitMessage] = useState('');

  const loadFiles = async () => {
    if (!workspacePath) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await (window as any).electron.git.listFiles(currentPath);

      if (result.success) {
        setFiles(result.files || []);
        setDirs(result.dirs || []);
      } else {
        setError(result.error || 'Failed to load files');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGitStatus = async () => {
    if (!workspacePath) return;

    try {
      const status = await (window as any).electron.git.status();
      setGitStatus(status);
    } catch (err) {
      console.error('Failed to load git status:', err);
    }
  };

  React.useEffect(() => {
    if (workspacePath) {
      loadFiles();
      loadGitStatus();
    }
  }, [workspacePath, currentPath]);

  const navigateToDir = (dir: FileItem) => {
    setCurrentPath(dir.path);
  };

  const navigateUp = () => {
    if (currentPath === '.') return;
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/') || '.');
  };

  const selectFile = (file: FileItem) => {
    if (onFileSelect) {
      onFileSelect(file.path);
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim() || !onCreateFile) return;

    const filepath = currentPath === '.' ? newFileName : `${currentPath}/${newFileName}`;

    onCreateFile(filepath, '// New file\n');
    setNewFileName('');
    setShowCreateFile(false);

    setTimeout(() => {
      loadFiles();
      loadGitStatus();
    }, 500);
  };

  const handleCommit = async () => {
    if (!commitMessage.trim() || !onCommit) return;

    onCommit(commitMessage);
    setCommitMessage('');

    setTimeout(() => {
      loadGitStatus();
    }, 500);
  };

  const getFileStatusIcon = (filepath: string) => {
    if (!gitStatus) return null;

    if (gitStatus.modified.includes(filepath)) {
      return <span className="text-yellow-500 text-xs">M</span>;
    }
    if (gitStatus.added.includes(filepath)) {
      return <span className="text-green-500 text-xs">A</span>;
    }
    if (gitStatus.deleted.includes(filepath)) {
      return <span className="text-red-500 text-xs">D</span>;
    }
    if (gitStatus.untracked.includes(filepath)) {
      return <span className="text-primary text-xs">U</span>;
    }
    return null;
  };

  const totalChanges = gitStatus
    ? gitStatus.modified.length +
      gitStatus.added.length +
      gitStatus.deleted.length +
      gitStatus.untracked.length
    : 0;

  if (!workspacePath) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 text-gray-500 ${className}`}>
        <FolderOpen className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">No workspace selected</p>
        <p className="text-xs mt-1">Open a workspace to browse files</p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col bg-[#1e1e1e] border border-gray-800 rounded-lg overflow-hidden ${className}`}
    >
      {}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-gray-800">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Files</span>
          {totalChanges > 0 && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              {totalChanges}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCreateFile(!showCreateFile)}
          className="h-7 px-2 hover:bg-gray-700"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {}
      {showCreateFile && (
        <div className="p-3 bg-[#252526] border-b border-gray-800">
          <div className="flex gap-2">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename.ts"
              className="flex-1 h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') setShowCreateFile(false);
              }}
              autoFocus
            />
            <Button size="sm" onClick={handleCreateFile} className="h-8 px-3">
              Create
            </Button>
          </div>
        </div>
      )}

      {}
      {error && (
        <Alert variant="destructive" className="m-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-1">
            {}
            {currentPath !== '.' && (
              <button
                onClick={navigateUp}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-400 hover:bg-gray-800 rounded"
              >
                <FolderOpen className="w-4 h-4" />
                <span>..</span>
              </button>
            )}

            {}
            {dirs.map((dir) => (
              <button
                key={dir.path}
                onClick={() => navigateToDir(dir)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-800 rounded"
              >
                <FolderOpen className="w-4 h-4 text-primary" />
                <span className="flex-1 text-left">{dir.name}</span>
              </button>
            ))}

            {}
            {files.map((file) => (
              <button
                key={file.path}
                onClick={() => selectFile(file)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-800 rounded"
              >
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="flex-1 text-left">{file.name}</span>
                {getFileStatusIcon(file.path)}
              </button>
            ))}

            {dirs.length === 0 && files.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                <p>Empty directory</p>
              </div>
            )}
          </div>
        )}
      </div>

      {}
      {totalChanges > 0 && (
        <div className="border-t border-gray-800 p-3 bg-[#252526]">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <GitBranch className="w-3.5 h-3.5" />
              <span>Changes: {totalChanges}</span>
            </div>

            <div className="flex gap-2">
              <Input
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message..."
                className="flex-1 h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCommit();
                }}
              />
              <Button
                size="sm"
                onClick={handleCommit}
                disabled={!commitMessage.trim()}
                className="h-8 px-3"
              >
                <GitCommit className="w-3.5 h-3.5 mr-1" />
                Commit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileBrowser;
