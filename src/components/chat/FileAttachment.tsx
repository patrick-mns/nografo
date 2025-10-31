import React, { useState } from 'react';
import { X, File, FileText, Code, Folder } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export interface AttachedFile {
  path: string;
  content: string;
  language?: string;
  size: number;
}

interface FileAttachmentProps {
  files: AttachedFile[];
  onRemove: (path: string) => void;
  className?: string;
}

export const FileAttachment: React.FC<FileAttachmentProps> = ({
  files,
  onRemove,
  className = '',
}) => {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();

    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs'].includes(ext || '')) {
      return <Code className="w-3 h-3" />;
    }
    if (['md', 'txt', 'json', 'yaml', 'yml', 'xml'].includes(ext || '')) {
      return <FileText className="w-3 h-3" />;
    }
    return <File className="w-3 h-3" />;
  };

  if (files.length === 0) return null;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Folder className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {files.length} file{files.length !== 1 ? 's' : ''} attached
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {files.map((file) => {
          const fileName = file.path.split('/').pop() || file.path;
          const isExpanded = expandedFile === file.path;

          return (
            <div key={file.path} className="flex flex-col gap-1">
              <div
                className="flex items-center gap-2 px-2 py-1 bg-muted rounded-md border border-border hover:bg-muted/80 transition-colors cursor-pointer group"
                onClick={() => setExpandedFile(isExpanded ? null : file.path)}
                title={file.path}
              >
                {getFileIcon(file.path)}
                <span className="text-xs font-mono max-w-[150px] truncate">{fileName}</span>
                {file.language && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1">
                    {file.language}
                  </Badge>
                )}
                <span className="text-[10px] text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(file.path);
                  }}
                  className="w-4 h-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove file"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>

              {}
              {isExpanded && (
                <div className="ml-6 p-2 bg-background border border-border rounded text-xs font-mono max-h-[200px] overflow-auto">
                  <pre className="whitespace-pre-wrap break-all">
                    {file.content.substring(0, 500)}
                    {file.content.length > 500 && '...'}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileAttachment;
