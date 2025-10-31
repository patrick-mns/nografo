import { aiService } from '@/services/aiService';
import { useGraphStore } from '@/store/graphStore';
import type { AIConfig } from '@/store/secretsStore';

interface GraphData {
  nodes?: any[];
  edges?: any[];
}

const parseGraphResponse = (response: string) => {
  const actions = [];

  try {
    const jsonData = JSON.parse(response.trim());
    if (jsonData.nodes) {
      actions.push({ type: 'newGraph', data: jsonData });
      return { cleanResponse: 'Context applied successfully!', actions };
    }
  } catch (e) {
    const jsonMatch = response.match(/\{[\s\S]*"nodes"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[0]);
        if (jsonData.nodes) {
          actions.push({ type: 'newGraph', data: jsonData });
          return { cleanResponse: 'Context applied successfully!', actions };
        }
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
      }
    }
  }

  return { cleanResponse: response, actions };
};

const executeActions = (actions: any[]) => {
  const { nodes, edges, addNode, setNodes, loadGraph } = useGraphStore.getState();

  actions.forEach((action) => {
    switch (action.type) {
      case 'newGraph':
        if (action.data.nodes && action.data.edges) {
          if (nodes.length > 0) {
            const allNodes = [...nodes, ...action.data.nodes];
            const allEdges = [...edges, ...action.data.edges];
            loadGraph(JSON.stringify({ nodes: allNodes, edges: allEdges }));
          } else {
            loadGraph(JSON.stringify(action.data));
          }
        } else if (action.data.nodes) {
          if (nodes.length > 0) {
            const allNodes = [...nodes, ...action.data.nodes];
            setNodes(allNodes);
          } else {
            setNodes(action.data.nodes);
          }
        }
        break;
      case 'addNodes':
        if (Array.isArray(action.data)) {
          action.data.forEach((nodeData: any) => {
            addNode({
              type: nodeData.type || 'contextNode',
              position: nodeData.position || {
                x: Math.random() * 400 - 200,
                y: Math.random() * 400 - 200,
              },
              data: nodeData.data,
            });
          });
        }
        break;
    }
  });
};

export const generateContextualPrompt = (): GraphData => {
  const { nodes, edges } = useGraphStore.getState();

  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      label: n.data.label,
      content: n.data.content,
      active: n.data.active,
    })),
    edges: edges.map((e) => ({
      source: e.source,
      target: e.target,
    })),
  };
};

export const handleActiveCommand = async (
  argument: string,
  config: AIConfig,
  onUpdateNode: (id: string, data: any) => void,
  onExportContext: () => Promise<void>
): Promise<string> => {
  try {
    const context = generateContextualPrompt();
    const response = await aiService.activeCommand(argument, context, config);

    const activeNodeIds = JSON.parse(response.trim());
    const { nodes } = useGraphStore.getState();

    nodes.forEach((node) => {
      const shouldBeActive = activeNodeIds.includes(node.id);
      if (node.data.active !== shouldBeActive) {
        onUpdateNode(node.id, { active: shouldBeActive });
      }
    });

    await onExportContext();

    return `Updated active status for ${activeNodeIds.length} nodes.`;
  } catch (error) {
    console.error('Error parsing active command response:', error);
    throw new Error('Active command failed');
  }
};

export const handleAddCommand = async (argument: string, config: AIConfig): Promise<string> => {
  try {
    const context = generateContextualPrompt();
    const response = await aiService.addCommand(argument, context, config);

    const { cleanResponse, actions } = parseGraphResponse(response);

    if (actions.length > 0) {
      executeActions(actions);
    }

    return cleanResponse;
  } catch (error) {
    console.error('Error in add command:', error);
    throw new Error('Add command failed');
  }
};

export const handleCreateCommand = async (argument: string, config: AIConfig): Promise<string> => {
  try {
    const response = await aiService.createCommand(argument, config);

    const { cleanResponse, actions } = parseGraphResponse(response);

    if (actions.length > 0) {
      executeActions(actions);
    }

    return cleanResponse;
  } catch (error) {
    console.error('Error in create command:', error);
    throw new Error('Create command failed');
  }
};

export const handleClearCommand = (): string => {
  const { clearGraph } = useGraphStore.getState();
  clearGraph();
  return 'Graph cleared.';
};

export const handleHelpCommand = (): string => {
  return `## 📋 Available Commands

### Create & Modify
- **\`/create <description>\`** - Create a new graph from scratch
- **\`/add <description>\`** - Add nodes to the existing graph

### Manage Context
- **\`/active <description>\`** - Mark specific nodes as active based on description

### Utilities
- **\`/clear\`** - Clear all nodes from the graph
- **\`/help\`** - Show this help message

---

💡 **Tip:** Use natural language descriptions for better results!`;
};
