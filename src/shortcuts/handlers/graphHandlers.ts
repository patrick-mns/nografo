import { useGraphStore } from '@/store/graphStore';
import { useToast } from '@/hooks/useToast';
import { createNewGraph } from '@/utils/graphCreation';

interface GraphHandlersOptions {
  onSaveToWorkspace?: (graphId: string, data: unknown) => Promise<void> | Promise<boolean>;
  onRefreshGraphs?: () => Promise<void>;
  onDeleteFromWorkspace?: (graphId: string) => Promise<void> | Promise<boolean>;
}

export function useGraphHandlers(options?: GraphHandlersOptions) {
  const { currentGraph, updateGraph, exportGraph, loadGraphData, setCurrentGraph } =
    useGraphStore();
  const { toast } = useToast();

  const { onSaveToWorkspace, onRefreshGraphs, onDeleteFromWorkspace } = options || {};

  const handleSave = async () => {
    if (!currentGraph) {
      toast({
        title: 'No graph selected',
        description: 'Create or open a graph first',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (onSaveToWorkspace) {
        const graphData = exportGraph();

        const dataWithMetadata = {
          ...graphData,
          id: currentGraph.id,
          name: currentGraph.name,
          description: currentGraph.description,
          repository_owner: currentGraph.repository_owner,
          repository_name: currentGraph.repository_name,
          repository_branch: currentGraph.repository_branch,
          sync_enabled: currentGraph.sync_enabled,
        };

        await onSaveToWorkspace(currentGraph.id, dataWithMetadata);

        if (onRefreshGraphs) {
          await onRefreshGraphs();
        }

        toast({
          title: 'Graph saved',
          description: `"${currentGraph.name}" saved to workspace`,
        });
      } else {
        await updateGraph(currentGraph.id, currentGraph.name, currentGraph.description);

        toast({
          title: 'Graph saved',
          description: `"${currentGraph.name}" saved successfully`,
        });
      }
    } catch (error) {
      console.error('❌ Save failed:', error);
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save graph',
        variant: 'destructive',
      });
    }
  };

  const handleNew = async () => {
    try {
      const newGraph = await createNewGraph({
        onSaveToWorkspace,
        onRefreshGraphs,
      });

      if (onSaveToWorkspace) {
        toast({
          title: 'New graph created',
          description: `"${newGraph.name}" has been created and saved`,
        });
      } else {
        toast({
          title: 'New graph created',
          description: 'Start adding nodes to your graph',
        });
      }
    } catch (error) {
      console.error('Failed to create new graph:', error);
      const message = error instanceof Error ? error.message : 'Failed to create graph';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!currentGraph) {
      toast({
        title: 'No graph selected',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${currentGraph.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      const graphName = currentGraph.name;
      const graphId = currentGraph.id;

      if (onDeleteFromWorkspace) {
        try {
          await onDeleteFromWorkspace(graphId);

          loadGraphData({ nodes: [], edges: [] });
          setCurrentGraph(null);

          if (onRefreshGraphs) {
            await onRefreshGraphs();
          }

          toast({
            title: 'Graph deleted',
            description: `"${graphName}" has been permanently deleted`,
          });
        } catch (error) {
          console.error('❌ Failed to delete graph from workspace:', error);
          toast({
            title: 'Delete failed',
            description: 'Failed to delete graph from workspace',
            variant: 'destructive',
          });
        }
      } else {
        loadGraphData({ nodes: [], edges: [] });
        setCurrentGraph(null);

        toast({
          title: 'Graph cleared',
          description: `"${graphName}" has been cleared from memory`,
        });
      }
    }
  };

  const handleExport = () => {
    if (!currentGraph) {
      toast({
        title: 'No graph selected',
        variant: 'destructive',
      });
      return;
    }

    try {
      const data = exportGraph();
      const exportData = {
        ...currentGraph,
        data,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentGraph.name.replace(/\s+/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Graph exported',
        description: `"${currentGraph.name}" exported successfully`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export graph',
        variant: 'destructive',
      });
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const {
          currentGraph: existingGraph,
          nodes: currentNodes,
          edges: currentEdges,
        } = useGraphStore.getState();

        if (existingGraph && (currentNodes.length > 0 || currentEdges.length > 0)) {
          if (onSaveToWorkspace) {
            try {
              const graphData = exportGraph();
              const dataWithMetadata = {
                ...graphData,
                id: existingGraph.id,
                name: existingGraph.name,
                description: existingGraph.description,
                repository_owner: existingGraph.repository_owner,
                repository_name: existingGraph.repository_name,
                repository_branch: existingGraph.repository_branch,
                sync_enabled: existingGraph.sync_enabled,
              };

              await onSaveToWorkspace(existingGraph.id, dataWithMetadata);
            } catch (saveError) {
              console.error('Error saving current graph before import:', saveError);
              toast({
                title: 'Warning',
                description:
                  'Could not save current graph automatically. Make sure to save it manually if needed.',
                variant: 'default',
              });
            }
          }
        }

        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.name || !data.data || !data.data.nodes || !data.data.edges) {
          throw new Error('Invalid graph file format');
        }

        setCurrentGraph({
          id: `imported-${Date.now()}`,
          name: `${data.name} (imported)`,
          description: data.description || '',
        });

        loadGraphData(data.data);

        toast({
          title: 'Graph imported',
          description: `"${data.name}" imported successfully`,
        });
      } catch (error) {
        toast({
          title: 'Import failed',
          description: error instanceof Error ? error.message : 'Invalid file format',
          variant: 'destructive',
        });
      }
    };

    input.click();
  };

  return {
    handleSave,
    handleNew,
    handleDelete,
    handleExport,
    handleImport,
  };
}
