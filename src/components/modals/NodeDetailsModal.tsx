import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Hash, FileText, ToggleLeft, ToggleRight, Paperclip, File } from 'lucide-react';
import type { AttachedFile } from '@/lib/electron';

interface NodeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData: {
    id: string;
    label: string;
    content: string;
    active: boolean;
    attachedFiles?: AttachedFile[];
  } | null;
}

const NodeDetailsModal: React.FC<NodeDetailsModalProps> = ({ isOpen, onClose, nodeData }) => {
  if (!nodeData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Node Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Node Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ID:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{nodeData.id}</code>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge
                  variant={nodeData.active ? 'default' : 'secondary'}
                  className="flex items-center gap-1"
                >
                  {nodeData.active ? (
                    <>
                      <ToggleRight className="h-3 w-3" />
                      Active
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-3 w-3" />
                      Inactive
                    </>
                  )}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Title</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{nodeData.label || 'Untitled Node'}</p>
              </div>
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-lg min-h-[120px]">
                {nodeData.content ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{nodeData.content}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No content available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Characters:</span>
                  <span className="font-medium">{nodeData.content?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Words:</span>
                  <span className="font-medium">
                    {nodeData.content
                      ? nodeData.content.trim().split(/\s+/).filter(Boolean).length
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lines:</span>
                  <span className="font-medium">
                    {nodeData.content ? nodeData.content.split('\n').length : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title length:</span>
                  <span className="font-medium">{nodeData.label?.length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {}
          {nodeData.attachedFiles && nodeData.attachedFiles.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attached Files ({nodeData.attachedFiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {nodeData.attachedFiles.map((file, index) => (
                    <div
                      key={`${file.path}-${index}`}
                      className="flex items-center gap-2 p-2 bg-muted rounded-md"
                    >
                      <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground truncate font-mono">
                          {file.path}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NodeDetailsModal;
