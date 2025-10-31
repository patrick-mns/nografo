import React, { useState, useEffect, useRef } from 'react';
import { File, Folder, ChevronRight } from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface FileAutoCompleteProps {
  query: string;
  onSelect: (filePath: string) => void;
  onClose: () => void;
  workspace: { path: string; name: string } | null;
}

export const FileAutoComplete: React.FC<FileAutoCompleteProps> = ({
  query,
  onSelect,
  onClose,
  workspace,
}) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileNode[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!workspace) {
      console.log('[FileAutoComplete] No workspace selected');
      return;
    }

    const loadFiles = async () => {
      if (!window.electron?.git) {
        console.log('[FileAutoComplete] Electron git API not available');
        return;
      }

      console.log('[FileAutoComplete] Loading files from workspace:', workspace.name);
      setLoading(true);

      try {
        const allFiles = await getAllFiles('.');
        console.log('[FileAutoComplete] Total files loaded:', allFiles.length);

        const fileList = allFiles.map((filePath: string) => ({
          name: filePath.split('/').pop() || filePath,
          path: filePath,
          type: 'file' as const,
        }));

        setFiles(fileList);
        setFilteredFiles(fileList.slice(0, 10));
        console.log('[FileAutoComplete] Files set, showing first 10');
      } catch (error) {
        console.error('❌ Error loading files:', error);
      } finally {
        setLoading(false);
      }
    };

    const getAllFiles = async (dir: string): Promise<string[]> => {
      console.log('[FileAutoComplete] Listing files in:', dir);
      const result = await window.electron!.git.listFiles(dir);
      console.log('[FileAutoComplete] List result:', result);

      if (!result.success) {
        console.log('[FileAutoComplete] List failed:', result.error);
        return [];
      }

      let allFiles: string[] = [];

      if (result.files) {
        allFiles = result.files.map((f: any) => f.path || f.name);
      }

      if (result.dirs) {
        for (const dirEntry of result.dirs) {
          const dirPath = dirEntry.path || dirEntry.name;
          const subFiles = await getAllFiles(dirPath);
          allFiles = [...allFiles, ...subFiles];
        }
      }

      return allFiles;
    };

    loadFiles();
  }, [workspace]);

  useEffect(() => {
    if (!query) {
      setFilteredFiles(files.slice(0, 10));
      setSelectedIndex(0);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = files
      .filter((file) => {
        const fileName = file.name.toLowerCase();
        const filePath = file.path.toLowerCase();
        return fileName.includes(lowerQuery) || filePath.includes(lowerQuery);
      })
      .slice(0, 10);

    setFilteredFiles(filtered);
    setSelectedIndex(0);
  }, [query, files]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredFiles.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => (prev < filteredFiles.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredFiles.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (filteredFiles[selectedIndex]) {
          onSelect(filteredFiles[selectedIndex].path);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [filteredFiles, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    if (dropdownRef.current && selectedIndex >= 0) {
      const container = dropdownRef.current.querySelector('.max-h-\\[250px\\]');
      if (container) {
        const selectedElement = container.children[selectedIndex] as HTMLElement;
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }
  }, [selectedIndex]);

  if (!workspace) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden min-w-[350px] max-w-[500px]"
      style={{
        bottom: 'calc(100% + 8px)',
        left: 0,
        right: 0,
      }}
    >
      {loading ? (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          Loading files from workspace...
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="px-3 py-2">
          <div className="text-xs text-muted-foreground">
            {files.length === 0
              ? 'No files found in workspace'
              : query
                ? `No files matching "${query}"`
                : 'No files to display'}
          </div>
          {files.length === 0 && (
            <div className="text-xs text-muted-foreground mt-1">Make sure a workspace is open</div>
          )}
        </div>
      ) : (
        <>
          <div className="max-h-[250px] overflow-y-auto">
            {filteredFiles.map((file, index) => {
              const isDirectory = file.type === 'directory';
              const Icon = isDirectory ? Folder : File;
              const fileName = file.name;
              const filePath = file.path !== file.name ? file.path : null;

              return (
                <button
                  key={file.path}
                  onClick={() => onSelect(file.path)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isDirectory ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{fileName}</div>
                    {filePath && (
                      <div className="text-xs text-muted-foreground truncate">{filePath}</div>
                    )}
                  </div>
                  {index === selectedIndex && <ChevronRight className="w-3 h-3 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 border-t border-border">
            <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px]">↑↓</kbd> navigate ·
            <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] ml-1">Enter</kbd> select
            ·<kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] ml-1">Esc</kbd> close
          </div>
        </>
      )}
    </div>
  );
};

export default FileAutoComplete;
