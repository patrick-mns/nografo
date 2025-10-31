import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { File, Folder } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { getWorkspaceAPI, type FileItem, type AttachedFile } from '@/lib/electron';

interface FileAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachedFiles: AttachedFile[];
  onFilesChange: (files: AttachedFile[]) => void;
}

export const FileAttachmentModal: React.FC<FileAttachmentModalProps> = ({
  isOpen,
  onClose,
  attachedFiles,
  onFilesChange,
}) => {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [localAttachedFiles, setLocalAttachedFiles] = useState<AttachedFile[]>(attachedFiles);
  const attachedFilesRef = useRef<AttachedFile[]>(attachedFiles);
  const { toast } = useToast();
  const workspaceAPI = getWorkspaceAPI();

  useEffect(() => {
    setLocalAttachedFiles(attachedFiles);
    attachedFilesRef.current = attachedFiles;
  }, [attachedFiles]);

  useEffect(() => {
    attachedFilesRef.current = localAttachedFiles;
  }, [localAttachedFiles]);

  const loadFiles = useCallback(
    async (dirPath: string = '') => {
      if (!workspaceAPI) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Workspace API not available',
        });
        return;
      }

      setLoadingFiles(true);
      try {
        const fileList = await workspaceAPI.listFiles(dirPath);
        setFiles(fileList);
        setCurrentPath(dirPath);
      } catch (error) {
        console.error('Error loading files:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load files',
        });
        setFiles([]);
      } finally {
        setLoadingFiles(false);
      }
    },
    [workspaceAPI, toast]
  );

  useEffect(() => {
    if (isOpen) {
      loadFiles('');
    }
  }, [isOpen, loadFiles]);

  const handleAttachFile = async (file: FileItem) => {
    if (file.isDirectory) {
      await loadFiles(file.path);
      return;
    }

    if (localAttachedFiles.some((f) => f.path === file.path)) {
      toast({
        title: 'Already Attached',
        description: 'This file is already attached to this node',
      });
      return;
    }

    const newFile: AttachedFile = {
      path: file.path,
      name: file.name,
      attachedAt: new Date().toISOString(),
    };

    const updatedFiles = [...localAttachedFiles, newFile];
    setLocalAttachedFiles(updatedFiles);
    toast({
      title: 'File Attached',
      description: `${file.name} attached successfully`,
    });
  };

  const handleRemoveFile = (filePath: string) => {
    const updatedFiles = localAttachedFiles.filter((f) => f.path !== filePath);
    setLocalAttachedFiles(updatedFiles);
    toast({
      title: 'File Removed',
      description: 'File detached from node',
    });
  };

  const navigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length === 0) return;
    parts.pop();
    loadFiles(parts.join('/'));
  };

  const handleClose = () => {
    const currentFiles = attachedFilesRef.current;
    onFilesChange(currentFiles);

    if (currentFiles.length > 0) {
      toast({
        title: 'Files Attached',
        description: `${currentFiles.length} file(s) attached to node`,
      });
    }

    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[600px]" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Attach Files from Workspace</DialogTitle>
          <DialogDescription>
            Select files from your workspace to attach to this node
          </DialogDescription>
        </DialogHeader>

        {}
        <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-2">
          <Folder className="h-4 w-4" />
          <span className="font-mono">{currentPath || '/'}</span>
          {localAttachedFiles.length > 0 && (
            <Badge variant="default" className="ml-auto">
              {localAttachedFiles.length} file{localAttachedFiles.length !== 1 ? 's' : ''} selected
            </Badge>
          )}
          {currentPath && (
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateUp}
              className={localAttachedFiles.length > 0 ? '' : 'ml-auto'}
            >
              ← Back
            </Button>
          )}
        </div>

        {}
        <div className="border rounded-md overflow-hidden">
          <div className="max-h-[300px] overflow-y-auto">
            {loadingFiles ? (
              <div className="p-8 text-center text-muted-foreground">Loading files...</div>
            ) : files.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No files found in this directory
              </div>
            ) : (
              <div className="divide-y">
                {files.map((file) => {
                  const isAttached = localAttachedFiles.some((f) => f.path === file.path);

                  return (
                    <div
                      key={file.path}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors"
                    >
                      <button
                        className="flex items-center gap-3 flex-1 text-left"
                        onClick={() => handleAttachFile(file)}
                      >
                        {file.isDirectory ? (
                          <Folder className="h-5 w-5 text-primary flex-shrink-0" />
                        ) : (
                          <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="text-sm truncate flex-1">{file.name}</span>
                      </button>

                      {isAttached && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(file.path);
                          }}
                          className="h-7 px-2 text-xs"
                        >
                          Detach
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
