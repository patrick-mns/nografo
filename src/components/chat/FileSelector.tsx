import React, { useState, useEffect } from 'react';
import { Search, File, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface FileSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (filePath: string) => void;
  workspace: { path: string; name: string } | null;
}

export const FileSelector: React.FC<FileSelectorProps> = ({
  open,
  onClose,
  onSelect,
  workspace,
}) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && workspace) {
      loadFiles();
    }
  }, [open, workspace]);

  const loadFiles = async () => {
    if (!window.electron?.git || !workspace) return;

    setLoading(true);
    try {
      const result = await window.electron.git.listFiles();
      if (result.success && result.files) {
        const fileTree = buildFileTree(result.files);
        setFiles(fileTree);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildFileTree = (filePaths: string[]): FileNode[] => {
    const root: FileNode = { name: '', path: '', type: 'directory', children: [] };

    filePaths.forEach((filePath) => {
      const parts = filePath.split('/');
      let currentNode = root;

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const currentPath = parts.slice(0, index + 1).join('/');

        if (!currentNode.children) {
          currentNode.children = [];
        }

        let childNode = currentNode.children.find((child) => child.name === part);

        if (!childNode) {
          childNode = {
            name: part,
            path: currentPath,
            type: isFile ? 'file' : 'directory',
            children: isFile ? undefined : [],
          };
          currentNode.children.push(childNode);
        }

        currentNode = childNode;
      });
    });

    const sortNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    };

    const sortRecursively = (node: FileNode): FileNode => {
      if (node.children) {
        node.children = sortNodes(node.children.map(sortRecursively));
      }
      return node;
    };

    return sortNodes((root.children || []).map(sortRecursively));
  };

  const toggleDirectory = (path: string) => {
    setExpandedDirs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const filterFiles = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes;

    const lowerQuery = query.toLowerCase();

    return nodes
      .map((node) => {
        if (node.type === 'file') {
          return node.name.toLowerCase().includes(lowerQuery) ? node : null;
        }

        const filteredChildren = filterFiles(node.children || [], query);
        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }

        return node.name.toLowerCase().includes(lowerQuery) ? node : null;
      })
      .filter(Boolean) as FileNode[];
  };

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    const filteredNodes = searchQuery ? filterFiles(nodes, searchQuery) : nodes;

    return filteredNodes.map((node) => {
      const isExpanded = expandedDirs.has(node.path);
      const hasChildren = node.children && node.children.length > 0;

      return (
        <div key={node.path}>
          <div
            className={`flex items-center gap-1 px-2 py-1 hover:bg-muted rounded cursor-pointer transition-colors`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => {
              if (node.type === 'directory') {
                toggleDirectory(node.path);
              } else {
                onSelect(node.path);
                onClose();
              }
            }}
          >
            {node.type === 'directory' ? (
              <>
                {hasChildren &&
                  (isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  ))}
                {!hasChildren && <div className="w-3" />}
                <Folder className="w-4 h-4 text-primary" />
              </>
            ) : (
              <>
                <div className="w-3" />
                <File className="w-4 h-4 text-muted-foreground" />
              </>
            )}
            <span className="text-sm">{node.name}</span>
          </div>

          {node.type === 'directory' && isExpanded && node.children && (
            <div>{renderFileTree(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select File from Workspace</DialogTitle>
          <DialogDescription>Choose a file to attach as context for the AI</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {}
          <div className="h-[400px] overflow-auto border rounded-md p-2">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading files...
              </div>
            ) : files.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No files found
              </div>
            ) : (
              renderFileTree(files)
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileSelector;
