import React, { useState, useEffect, useRef } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position, useReactFlow } from 'reactflow';
import { Card, CardContent, CardHeader } from '../ui/card';
import { File, X, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { useGraphStore } from '../../store/graphStore';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/useToast';
import { useSecretsStore } from '../../store/secretsStore';
import { aiService } from '../../services/aiService';
import { isElectron, type AttachedFile } from '@/lib/electron';
import { FileAttachmentModal } from '../modals';
import { ContextNodeMenu } from './ContextNodeMenu';
import { Paperclip } from 'lucide-react';

const ContextNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const { updateNode, setSelectedNode, deleteNode, addNode, addEdge } = useGraphStore();
  const { getNode } = useReactFlow();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [localLabel, setLocalLabel] = useState(data.label || 'New Node');
  const [localContent, setLocalContent] = useState(data.content || '');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>(data.attachedFiles || []);
  const attachedFilesRef = useRef<AttachedFile[]>(data.attachedFiles || []);
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();
  const { config, isConfigured } = useSecretsStore();

  const isActive = data.active ?? true;

  useEffect(() => {
    const files = data.attachedFiles || [];
    setAttachedFiles(files);
    attachedFilesRef.current = files;
  }, [data.attachedFiles]);

  useEffect(() => {
    attachedFilesRef.current = attachedFiles;
  }, [attachedFiles]);

  const toggleActive = (checked: boolean | string) => {
    updateNode(id, { active: !!checked });
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(id);
  };

  const handleOpenEditDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalLabel(data.label || 'New Node');
    setLocalContent(data.content || '');
    setAttachedFiles(data.attachedFiles || []);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    updateNode(id, {
      label: localLabel,
      content: localContent,
      attachedFiles: attachedFiles,
    });
    setIsEditDialogOpen(false);
    toast({
      title: 'Success',
      description: 'Node updated successfully',
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
    toast({
      title: 'Success',
      description: 'Node deleted successfully',
    });
  };

  const createConnectedNode = (
    e: React.MouseEvent,
    direction: 'top' | 'right' | 'bottom' | 'left'
  ) => {
    e.stopPropagation();

    const currentNode = getNode(id);
    const baseX = currentNode?.position?.x || 0;
    const baseY = currentNode?.position?.y || 0;

    const offset = 280;

    let newPosition;
    switch (direction) {
      case 'top':
        newPosition = { x: baseX, y: baseY - offset };
        break;
      case 'right':
        newPosition = { x: baseX + offset, y: baseY };
        break;
      case 'bottom':
        newPosition = { x: baseX, y: baseY + offset };
        break;
      case 'left':
        newPosition = { x: baseX - offset, y: baseY };
        break;
    }

    const { nodes: existingNodes } = useGraphStore.getState();
    const hasNodeNearby = existingNodes.some(
      (node) =>
        Math.abs(node.position.x - newPosition.x) < 50 &&
        Math.abs(node.position.y - newPosition.y) < 50
    );

    if (hasNodeNearby) {
      const randomOffset = 30;
      newPosition.x += (Math.random() - 0.5) * randomOffset;
      newPosition.y += (Math.random() - 0.5) * randomOffset;
    }

    const newNodeData = {
      type: 'contextNode',
      position: newPosition,
      data: {
        label: 'New Node',
        content: 'Click to edit the context...',
        active: true,
      },
    };

    const { nodes: nodesBefore } = useGraphStore.getState();

    addNode(newNodeData);

    setTimeout(() => {
      const { nodes: nodesAfter } = useGraphStore.getState();

      const newNode = nodesAfter.find(
        (node) => !nodesBefore.some((beforeNode) => beforeNode.id === node.id)
      );

      if (newNode) {
        addEdge({
          source: id,
          target: newNode.id,
        });
      }
    }, 100);

    toast({
      title: 'Node Created',
      description: 'New connected node added successfully',
    });
  };

  const handleEnhance = async (
    task: 'improve' | 'expand' | 'summarize' | 'clarify',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    if (!isConfigured || !data.content || !data.content.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Configure AI settings first or add content to the node',
      });
      return;
    }

    setIsEnhancing(true);

    try {
      const api_key =
        config.selectedProvider === 'openai'
          ? config.openaiApiKey
          : config.selectedProvider === 'anthropic'
            ? config.anthropicApiKey
            : config.ollamaBaseUrl;

      const response = await aiService.enhanceContent({
        title: data.label || 'Node',
        content: data.content,
        task,
        provider: config.selectedProvider,
        api_key,
      });

      if (response.enhanced_content) {
        updateNode(id, { content: response.enhanced_content });
        toast({
          title: 'Success',
          description: `Content ${task}d successfully`,
        });
      }
    } catch (error) {
      console.error('Error enhancing content:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to enhance content',
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleOpenFileDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isElectron()) {
      toast({
        variant: 'destructive',
        title: 'Not Available',
        description: 'File attachment is only available in the desktop app',
      });
      return;
    }

    setIsFileDialogOpen(true);
  };

  const handleFilesChange = (files: AttachedFile[]) => {
    setAttachedFiles(files);
    attachedFilesRef.current = files;
    updateNode(id, {
      attachedFiles: files,
    });
  };

  const handleRemoveFile = (filePath: string) => {
    setAttachedFiles(attachedFiles.filter((f) => f.path !== filePath));
    toast({
      title: 'File Removed',
      description: 'File detached from node',
    });
  };

  return (
    <>
      <div
        className="min-w-[200px] max-w-[250px] relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {}
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="w-3 h-3 bg-primary border-2 border-white"
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="w-3 h-3 bg-primary border-2 border-white"
        />
        <Handle
          type="target"
          position={Position.Right}
          id="right"
          className="w-3 h-3 bg-primary border-2 border-white"
        />

        {}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${
            isHovered || selected ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {}
          <Button
            variant="ghost"
            size="sm"
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 h-5 w-5 p-0 bg-primary/80 hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg pointer-events-auto z-20 hover:scale-110 transition-all"
            onClick={(e) => createConnectedNode(e, 'top')}
            title="Add node above"
          >
            <Plus className="h-2.5 w-2.5" />
          </Button>

          {}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-1/2 -right-8 transform -translate-y-1/2 h-5 w-5 p-0 bg-primary/80 hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg pointer-events-auto z-20 hover:scale-110 transition-all"
            onClick={(e) => createConnectedNode(e, 'right')}
            title="Add node to the right"
          >
            <Plus className="h-2.5 w-2.5" />
          </Button>

          {}
          <Button
            variant="ghost"
            size="sm"
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 h-5 w-5 p-0 bg-primary/80 hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg pointer-events-auto z-20 hover:scale-110 transition-all"
            onClick={(e) => createConnectedNode(e, 'bottom')}
            title="Add node below"
          >
            <Plus className="h-2.5 w-2.5" />
          </Button>

          {}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-1/2 -left-8 transform -translate-y-1/2 h-5 w-5 p-0 bg-primary/80 hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg pointer-events-auto z-20 hover:scale-110 transition-all"
            onClick={(e) => createConnectedNode(e, 'left')}
            title="Add node to the left"
          >
            <Plus className="h-2.5 w-2.5" />
          </Button>
        </div>

        <Card
          className={`cursor-pointer hover:shadow-lg transition-all relative ${
            selected ? 'ring-2 ring-primary' : ''
          } ${isActive ? 'border-primary/50' : 'opacity-60'}`}
          onClick={handleSelect}
        >
          {}
          <div
            className={`absolute top-2 left-2 z-10 w-4 h-4 transition-opacity ${
              selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <Checkbox
              checked={isActive}
              onCheckedChange={toggleActive}
              onClick={(e) => e.stopPropagation()}
              className={`h-4 w-4 bg-background shadow-sm absolute top-0 left-0 ${
                isActive ? 'border-2 border-primary' : 'border-2 border-gray-400'
              }`}
            />
          </div>

          {}
          <div
            className={`absolute top-2 right-2 z-10 flex gap-1 transition-opacity ${
              selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <ContextNodeMenu
              isConfigured={isConfigured}
              isEnhancing={isEnhancing}
              hasContent={!!data.content?.trim()}
              onEdit={handleOpenEditDialog}
              onAttachFiles={handleOpenFileDialog}
              onEnhance={handleEnhance}
              onDelete={handleDelete}
            />
          </div>

          <CardHeader className="pb-2 pt-6">
            <h3 className="font-semibold text-sm truncate pr-8">{data.label || 'New Node'}</h3>
          </CardHeader>

          <CardContent className="pt-0">
            {isEnhancing ? (
              <div className="flex flex-col items-center justify-center py-4 gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <p className="text-xs text-muted-foreground">Processing...</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground line-clamp-3 pr-8">
                  {data.content || 'Click to edit the context...'}
                </p>
                {attachedFiles.length > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {attachedFiles.length} file{attachedFiles.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="w-3 h-3 bg-primary border-2 border-white"
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left-out"
          className="w-3 h-3 bg-primary border-2 border-white"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right-out"
          className="w-3 h-3 bg-primary border-2 border-white"
        />
      </div>

      {}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Edit Node</DialogTitle>
            <DialogDescription>Update the label and content of this node</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {}
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={localLabel}
                onChange={(e) => setLocalLabel(e.target.value)}
                placeholder="Node label..."
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {}
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
                placeholder="Node content..."
                rows={10}
                className="font-mono text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {}
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active in context</Label>
              <Checkbox
                id="active"
                checked={isActive}
                onCheckedChange={toggleActive}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {}
            {attachedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Attached Files</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {attachedFiles.map((file) => (
                    <div
                      key={file.path}
                      className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(file.path);
                        }}
                        className="h-6 w-6 p-0 flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {}
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleSaveEdit();
              }}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {}
      <FileAttachmentModal
        isOpen={isFileDialogOpen}
        onClose={() => setIsFileDialogOpen(false)}
        attachedFiles={attachedFiles}
        onFilesChange={handleFilesChange}
      />
    </>
  );
};

export default ContextNode;
