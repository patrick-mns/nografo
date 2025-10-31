import { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useGraphStore } from '@/store/graphStore';
import { Button } from '../ui/button';
import { FileJson, Plus, ChevronRight, ChevronDown, Trash2, Pencil } from 'lucide-react';
import { ConfirmationDialog } from '../ui/confirmation-dialog';
import { WorkspaceRequired } from '../workspace/WorkspaceRequired';
import { useToast } from '@/hooks/useToast';
import { setGraphLoading } from '@/hooks/useGraphAutosave';
import { createNewGraph } from '@/utils/graphCreation';

export function GraphExplorer() {
  const {
    workspace,
    graphs,
    deleteGraph,
    loadGraph: loadGraphFromWorkspace,
    saveGraph,
    refreshGraphs,
  } = useWorkspace();
  const {
    loadGraph: loadGraphToStore,
    setCurrentGraph,
    setLastOpenedGraph,
    removeLastOpenedGraph,
    isGraphLocked,
    currentGraph,
    clearGraphView,
  } = useGraphStore();
  const { toast } = useToast();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['graphs']));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [graphToDelete, setGraphToDelete] = useState<string | null>(null);
  const [editingGraphId, setEditingGraphId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingGraphId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingGraphId]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleGraphClick = async (graphId: string) => {
    if (isGraphLocked) {
      toast({
        variant: 'destructive',
        title: 'Graph Locked',
        description: 'Please wait for the current command to complete before switching graphs.',
      });
      return;
    }

    setGraphLoading(true);
    try {
      const currentGraph = useGraphStore.getState().currentGraph;

      if (currentGraph && currentGraph.id !== graphId) {
        console.log('⚠️ Skipping auto-save to prevent graph duplication bug');
      }

      const graphData = (await loadGraphFromWorkspace(graphId)) as {
        nodes?: unknown[];
        edges?: unknown[];
        name?: string;
        description?: string;
        repository_owner?: string;
        repository_name?: string;
        repository_branch?: string;
        sync_enabled?: boolean;
      };

      setCurrentGraph({
        id: graphId,
        name: graphData.name || graphId,
        description: graphData.description || '',
      });

      loadGraphToStore(JSON.stringify(graphData));

      const wasDifferentGraph = currentGraph && currentGraph.id !== graphId;
      if (wasDifferentGraph) {
        useGraphStore.getState().setShouldFitView(true);
      }

      if (workspace) {
        setLastOpenedGraph(workspace.path, graphId);
      }

      toast({
        title: 'Success',
        description: `Loaded graph: ${graphData.name || graphId}`,
      });
    } catch (error) {
      console.error('Error loading graph:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load graph',
      });
    } finally {
      setTimeout(() => setGraphLoading(false), 500);
    }
  };

  const handleNewGraph = async () => {
    try {
      const newGraph = await createNewGraph({
        onSaveToWorkspace: saveGraph,
        onRefreshGraphs: refreshGraphs,
      });

      loadGraphToStore(JSON.stringify({ nodes: [], edges: [] }));

      toast({
        title: 'Success',
        description: `New graph "${newGraph.name}" created`,
      });
    } catch (error) {
      console.error('Error creating graph:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create new graph',
      });
    }
  };

  const handleDeleteClick = (graphId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGraphToDelete(graphId);
    setDeleteDialogOpen(true);
  };

  const handleRenameClick = (graphId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGraphId(graphId);
    setEditingName(currentName);
  };

  const handleFinishRename = async (graphId: string) => {
    if (!editingName.trim()) {
      setEditingGraphId(null);
      setEditingName('');
      return;
    }

    const graph = graphs.find((g) => g.id === graphId);
    if (!graph || editingName.trim() === graph.name) {
      setEditingGraphId(null);
      setEditingName('');
      return;
    }

    try {
      const graphData = (await loadGraphFromWorkspace(graphId)) as {
        nodes?: unknown[];
        edges?: unknown[];
        name?: string;
        description?: string;
        repository_owner?: string;
        repository_name?: string;
        repository_branch?: string;
        sync_enabled?: boolean;
      };

      const updatedData = {
        ...graphData,
        name: editingName.trim(),
      };

      await saveGraph(graphId, updatedData);
      await refreshGraphs();

      if (currentGraph?.id === graphId) {
        setCurrentGraph({
          id: graphId,
          name: editingName.trim(),
          description: currentGraph.description || '',
        });
      }

      toast({
        title: 'Graph renamed',
        description: `Renamed to "${editingName.trim()}"`,
      });
    } catch (error) {
      console.error('Error renaming graph:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to rename graph',
      });
    } finally {
      setEditingGraphId(null);
      setEditingName('');
    }
  };

  const handleRenameKeyDown = (graphId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFinishRename(graphId);
    } else if (e.key === 'Escape') {
      setEditingGraphId(null);
      setEditingName('');
    }
  };

  const confirmDelete = async () => {
    if (!graphToDelete || !workspace) return;

    try {
      const isCurrentGraph = currentGraph?.id === graphToDelete;
      const graphName = graphs.find((g) => g.id === graphToDelete)?.name || graphToDelete;

      await deleteGraph(graphToDelete);

      removeLastOpenedGraph(workspace.path, graphToDelete);

      if (isCurrentGraph) {
        clearGraphView();
        setCurrentGraph(null);

        toast({
          title: 'Success',
          description: `Graph "${graphName}" deleted and view cleared`,
        });
      } else {
        toast({
          title: 'Success',
          description: `Graph "${graphName}" deleted successfully`,
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete graph',
      });
    } finally {
      setDeleteDialogOpen(false);
      setGraphToDelete(null);
    }
  };

  if (!workspace) {
    return <WorkspaceRequired />;
  }

  return (
    <div className="flex-1 overflow-auto">
      {}
      <div className="py-1">
        <button
          onClick={() => toggleSection('graphs')}
          className="w-full flex items-center gap-1 px-3 py-1.5 hover:bg-accent/50 transition-colors text-sm"
        >
          {expandedSections.has('graphs') ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium">Graphs</span>
          <span className="ml-auto text-xs text-muted-foreground">{graphs.length}</span>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              if (isGraphLocked) {
                toast({
                  variant: 'destructive',
                  title: 'Command Running',
                  description: 'Please wait for the current command to complete.',
                });
                return;
              }
              handleNewGraph();
            }}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 ml-1"
            title="New Graph"
            disabled={isGraphLocked}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </button>

        {expandedSections.has('graphs') && (
          <div className="py-1">
            {graphs.length === 0 ? (
              <div className="px-8 py-2 text-xs text-muted-foreground">No graphs yet</div>
            ) : (
              graphs
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((graph) => (
                  <div
                    key={graph.id}
                    className={`group flex items-center gap-2 px-8 py-1.5 transition-colors text-sm ${
                      isGraphLocked
                        ? 'cursor-not-allowed opacity-50'
                        : editingGraphId === graph.id
                          ? ''
                          : 'hover:bg-accent/50 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (editingGraphId !== graph.id) {
                        handleGraphClick(graph.id);
                      }
                    }}
                    draggable={!isGraphLocked && editingGraphId !== graph.id}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        'application/json',
                        JSON.stringify({
                          type: 'graph-reference',
                          graphId: graph.id,
                          graphName: graph.name,
                        })
                      );
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    title={
                      editingGraphId === graph.id
                        ? undefined
                        : `Drag to create graph reference or click to load`
                    }
                  >
                    <FileJson className="h-4 w-4 text-primary flex-shrink-0" />
                    {editingGraphId === graph.id ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleFinishRename(graph.id)}
                        onKeyDown={(e) => handleRenameKeyDown(graph.id, e)}
                        className="flex-1 bg-background border border-primary rounded px-1 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="flex-1 truncate text-foreground">{graph.name}</span>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingGraphId !== graph.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => handleRenameClick(graph.id, graph.name, e)}
                          disabled={isGraphLocked}
                          title="Rename graph"
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => handleDeleteClick(graph.id, e)}
                        disabled={isGraphLocked || editingGraphId === graph.id}
                        title="Delete graph"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
            )}

            {}
            <div
              className={`flex items-center gap-2 px-8 py-1.5 transition-colors text-sm text-muted-foreground ${
                isGraphLocked
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:bg-accent/50 cursor-pointer hover:text-foreground'
              }`}
              onClick={() => {
                if (isGraphLocked) {
                  toast({
                    variant: 'destructive',
                    title: 'Command Running',
                    description: 'Please wait for the current command to complete.',
                  });
                  return;
                }
                handleNewGraph();
              }}
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">New Graph</span>
            </div>
          </div>
        )}
      </div>

      {}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Graph"
        description="Are you sure you want to delete this graph? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
