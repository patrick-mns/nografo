import React, { useState } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader } from '../ui/card';
import { FileJson, ExternalLink, MoreVertical, Trash2, Link as LinkIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { useGraphStore } from '../../store/graphStore';
import { Checkbox } from '../ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/useToast';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Badge } from '../ui/badge';
import { GraphSelector } from './GraphSelector';

interface GraphReferenceData {
  label: string;
  content: string;
  active: boolean;
  graphId?: string;
  graphName?: string;
}

const GraphReferenceNode: React.FC<NodeProps<GraphReferenceData>> = ({ id, data, selected }) => {
  const {
    updateNode,
    setSelectedNode,
    deleteNode,
    loadGraph: loadGraphToStore,
    setCurrentGraph,
    setLastOpenedGraph,
    isGraphLocked,
  } = useGraphStore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSelectGraphDialogOpen, setIsSelectGraphDialogOpen] = useState(false);
  const [localLabel, setLocalLabel] = useState(data.label || 'Graph Reference');
  const [localContent, setLocalContent] = useState(data.content || '');
  const { toast } = useToast();
  const { loadGraph: loadGraphFromWorkspace, graphs: workspaceGraphs, workspace } = useWorkspace();

  const isActive = data.active ?? true;

  const toggleActive = (checked: boolean | string) => {
    updateNode(id, { active: !!checked });
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(id);
  };

  const handleOpenEditDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalLabel(data.label || 'Graph Reference');
    setLocalContent(data.content || '');
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    updateNode(id, {
      label: localLabel,
      content: localContent,
    });
    setIsEditDialogOpen(false);
    toast({
      title: 'Success',
      description: 'Graph reference updated successfully',
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
    toast({
      title: 'Success',
      description: 'Graph reference deleted successfully',
    });
  };

  const handleOpenSelectGraphDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelectGraphDialogOpen(true);
  };

  const handleSelectGraph = (graphId: string, graphName: string) => {
    updateNode(id, {
      graphId,
      graphName,
      label: graphName,
      content: `Reference to graph: ${graphName}`,
    });
    setIsSelectGraphDialogOpen(false);
    toast({
      title: 'Success',
      description: `Graph reference linked to: ${graphName}`,
    });
  };

  const handleDoubleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isGraphLocked) {
      toast({
        variant: 'destructive',
        title: 'Graph Locked',
        description: 'Please wait for the current command to complete before switching graphs.',
      });
      return;
    }

    if (!data.graphId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No graph selected for this reference',
      });
      return;
    }

    try {
      const graphData = await loadGraphFromWorkspace(data.graphId);

      if (
        !graphData ||
        typeof graphData !== 'object' ||
        !('nodes' in graphData) ||
        !('edges' in graphData)
      ) {
        throw new Error('Invalid graph data');
      }

      const typedGraphData = graphData as {
        nodes: unknown[];
        edges: unknown[];
        name?: string;
        description?: string;
      };

      setCurrentGraph({
        id: data.graphId,
        name: typedGraphData.name || data.graphName || data.graphId,
        description: typedGraphData.description || '',
      });

      loadGraphToStore(JSON.stringify(typedGraphData));

      setTimeout(() => {
        useGraphStore.getState().setShouldFitView(true);
      }, 200);

      if (workspace) {
        setLastOpenedGraph(workspace.path, data.graphId);
      }

      toast({
        title: 'Graph Loaded',
        description: `Successfully loaded graph: ${data.graphName}`,
      });
    } catch (error) {
      console.error('Error loading referenced graph:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to load graph: ${data.graphName}`,
      });
    }
  };

  const allGraphs = [...(workspaceGraphs || []).map((g) => ({ ...g, source: 'workspace' }))];

  return (
    <>
      <div className="min-w-[200px] max-w-[280px] relative group">
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

        <Card
          className={`cursor-pointer hover:shadow-lg transition-all relative border-border ${
            selected ? 'ring-2 ring-primary' : ''
          } ${isActive ? 'border-primary' : 'opacity-60'}`}
          onClick={handleSelect}
          onDoubleClick={handleDoubleClick}
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
                isActive ? 'border-2 border-primary' : 'border-2 border-muted-foreground'
              }`}
            />
          </div>

          {}
          <div
            className={`absolute top-2 right-2 z-10 flex gap-1 transition-opacity ${
              selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="h-6 w-6 p-0 bg-background/90 hover:bg-background border shadow-sm backdrop-blur-sm"
                  title="Graph reference actions"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleOpenEditDialog}>
                  <FileJson className="mr-2 h-4 w-4" />
                  <span>Edit Reference</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleOpenSelectGraphDialog}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  <span>Select Graph</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Reference</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <CardHeader className="pb-2 pt-6">
            <div className="flex items-center gap-2">
              <FileJson className="h-4 w-4 text-primary flex-shrink-0" />
              <h3 className="font-semibold text-sm truncate pr-8">
                {data.label || 'Graph Reference'}
              </h3>
            </div>
            {data.graphName && (
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="outline" className="text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {data.graphName}
                </Badge>
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground line-clamp-3 pr-8">
              {data.content || 'Double-click to load this graph...'}
            </p>
            {!data.graphId && (
              <p className="text-xs text-orange-500 mt-2">
                No graph selected. Click the menu to select one.
              </p>
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
            <DialogTitle>Edit Graph Reference</DialogTitle>
            <DialogDescription>
              Update the label and description of this graph reference
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={localLabel}
                onChange={(e) => setLocalLabel(e.target.value)}
                placeholder="Graph reference label..."
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Description</Label>
              <Input
                id="content"
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
                placeholder="Description of the referenced graph..."
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active in context</Label>
              <Checkbox
                id="active"
                checked={isActive}
                onCheckedChange={toggleActive}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {}
      <GraphSelector
        open={isSelectGraphDialogOpen}
        onOpenChange={setIsSelectGraphDialogOpen}
        graphs={allGraphs}
        onSelectGraph={handleSelectGraph}
      />
    </>
  );
};

export default GraphReferenceNode;
