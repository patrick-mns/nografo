import { useState } from 'react';
import { Download, Upload, Plus, Trash2, Files, FileJson, MessagesSquare } from 'lucide-react';
import { useGraphStore } from '../../store/graphStore';
import { GraphExplorer } from '../graph/GraphExplorer';
import { ChatsExplorer } from '../chat/ChatsExplorer';
import { ConfirmationDialog } from '../ui/confirmation-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { useWorkspace } from '@/contexts/WorkspaceContext';

type TabType = 'graphs' | 'chats';

const SidePanel: React.FC = () => {
  const { nodes, addNode, exportGraph, loadGraph, clearGraph, isGraphLocked, currentGraph } =
    useGraphStore();

  const { saveGraph: saveGraphToWorkspace, workspace } = useWorkspace();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('graphs');
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleAddNode = () => {
    const newNode = {
      type: 'contextNode',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        label: 'New Context',
        content: '',
        active: true,
      },
    };
    addNode(newNode);
  };

  const handleAddGraphReference = () => {
    const newNode = {
      type: 'graphReferenceNode',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        label: 'Graph Reference',
        content: 'Reference to another graph - select a graph to reference',
        active: true,
        graphId: undefined,
        graphName: undefined,
        isExpanded: false,
      },
    };
    addNode(newNode);
    toast({
      title: 'Graph Reference Created',
      description: 'Click the menu to select a graph to reference',
    });
  };

  const handleClearGraph = () => {
    setShowClearDialog(true);
  };

  const confirmClearGraph = async () => {
    const currentGraph = useGraphStore.getState().currentGraph;

    if (workspace && saveGraphToWorkspace && currentGraph) {
      try {
        await saveGraphToWorkspace(currentGraph.id, {
          nodes: [],
          edges: [],
          name: currentGraph.name,
          description: currentGraph.description,
        });
      } catch (error) {
        console.error('Error saving cleared graph:', error);
        toast({
          variant: 'destructive',
          title: 'Warning',
          description: 'Graph cleared locally but failed to save to workspace',
        });
      }
    }

    clearGraph();
    setShowClearDialog(false);

    toast({
      title: 'Success',
      description: 'Graph cleared successfully',
    });
  };

  const handleExport = () => {
    const data = exportGraph();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-context-graph.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result as string;
          const parsedData = JSON.parse(data);

          loadGraph(data);

          if (workspace && saveGraphToWorkspace) {
            try {
              const fileName = file.name.replace('.json', '');
              const graphId = fileName || `imported-${Date.now()}`;

              const graphDataWithName = {
                ...parsedData,
                name: parsedData.name || fileName || graphId,
              };

              await saveGraphToWorkspace(graphId, graphDataWithName);

              await new Promise((resolve) => setTimeout(resolve, 150));

              toast({
                title: 'Success',
                description: 'Graph imported and saved to workspace',
              });
            } catch (saveError) {
              console.error('Error saving to workspace:', saveError);
              toast({
                title: 'Partially successful',
                description: 'Graph loaded but failed to save to workspace',
              });
            }
          } else {
            toast({
              title: 'Success',
              description: 'Graph loaded successfully',
            });
          }
        } catch {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Error loading JSON file',
          });
        }
      };
      reader.readAsText(file);

      event.target.value = '';
    }
  };

  return (
    <div className="w-full bg-background/98 backdrop-blur-sm flex flex-col h-full">
      {}
      <div className="h-10 border-b border-border/40 flex items-center justify-center px-2 gap-1 bg-background/50">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-transparent"
          onClick={() => setActiveTab('graphs')}
          disabled={isGraphLocked}
          title={isGraphLocked ? 'Cannot switch while command is running' : 'Graphs'}
        >
          <Files
            className={`h-4 w-4 ${activeTab === 'graphs' ? 'text-primary' : 'text-muted-foreground'}`}
          />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-transparent"
          onClick={() => setActiveTab('chats')}
          disabled={isGraphLocked}
          title={isGraphLocked ? 'Cannot switch while command is running' : 'Chats'}
        >
          <MessagesSquare
            className={`h-4 w-4 ${activeTab === 'chats' ? 'text-primary' : 'text-muted-foreground'}`}
          />
        </Button>
      </div>

      {}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'graphs' ? <GraphExplorer /> : <ChatsExplorer />}
      </div>

      {}
      {activeTab === 'graphs' && workspace && (
        <div className="border-t border-border/40 bg-background/50">
          <div className="p-3 space-y-2">
            <div className="space-y-2">
              <Button
                onClick={handleAddNode}
                className="w-full"
                size="sm"
                disabled={isGraphLocked || !currentGraph}
                title={!currentGraph ? 'Select a graph first' : undefined}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Context Node
              </Button>
              <Button
                onClick={handleAddGraphReference}
                variant="outline"
                className="w-full"
                size="sm"
                disabled={isGraphLocked || !currentGraph}
                title={!currentGraph ? 'Select a graph first' : undefined}
              >
                <FileJson className="mr-2 h-4 w-4" />
                Add Graph Reference
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                disabled={nodes.length === 0 || isGraphLocked}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isGraphLocked}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
                <input
                  id="file-input"
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </div>
            </div>

            <Button
              onClick={handleClearGraph}
              variant="outline"
              size="sm"
              disabled={nodes.length === 0 || isGraphLocked}
              className="w-full text-xs"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          </div>
        </div>
      )}

      {}
      <ConfirmationDialog
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={confirmClearGraph}
        title="Clear All Nodes"
        description="Are you sure you want to clear all nodes from the graph? This action cannot be undone and will remove all your work."
        confirmText="Clear All"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default SidePanel;
