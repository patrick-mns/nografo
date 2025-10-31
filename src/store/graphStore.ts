import { create } from 'zustand';
import type { AttachedFile } from '@/lib/electron';
import { useHistoryStore } from './historyStore';

const STORAGE_KEY = 'ai-graph-context-manager';
const LAST_OPENED_GRAPHS_KEY = 'ai-graph-last-opened-by-workspace';

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const lastOpenedStored = localStorage.getItem(LAST_OPENED_GRAPHS_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        nodes: parsed.nodes || [],
        edges: parsed.edges || [],
        lastOpenedGraphByWorkspace: lastOpenedStored ? JSON.parse(lastOpenedStored) : {},
      };
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return { nodes: [], edges: [], lastOpenedGraphByWorkspace: {} };
};

const calculateDistances = (
  nodes: Node[],
  edges: Edge[],
  startId: string
): Record<string, number> => {
  const distances: Record<string, number> = {};
  const queue: string[] = [];
  const visited = new Set<string>();

  nodes.forEach((node) => {
    distances[node.id] = Infinity;
  });
  distances[startId] = 0;
  queue.push(startId);
  visited.add(startId);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentDistance = distances[currentId];

    const neighbors = edges
      .filter((edge) => edge.source === currentId || edge.target === currentId)
      .map((edge) => (edge.source === currentId ? edge.target : edge.source));

    neighbors.forEach((neighborId) => {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        distances[neighborId] = currentDistance + 1;
        queue.push(neighborId);
      }
    });
  }

  return distances;
};

const saveToStorage = (nodes: Node[], edges: Edge[]) => {
  try {
    const data = { nodes, edges };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const saveLastOpenedGraphs = (lastOpenedGraphByWorkspace: Record<string, string>) => {
  try {
    localStorage.setItem(LAST_OPENED_GRAPHS_KEY, JSON.stringify(lastOpenedGraphByWorkspace));
  } catch (error) {
    console.error('Error saving last opened graphs:', error);
  }
};

export interface Node {
  id: string;
  position: { x: number; y: number; z?: number };
  data: {
    label: string;
    content: string;
    active: boolean;
    attachedFiles?: AttachedFile[];

    graphId?: string;
    graphName?: string;
    isExpanded?: boolean;
  };
  type: string;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

interface GraphState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: string | null;
  currentGraph: {
    id: string;
    name: string;
    description: string;
    repository_owner?: string;
    repository_name?: string;
    repository_branch?: string;
    sync_enabled?: boolean;
  } | null;
  lastOpenedGraphByWorkspace: Record<string, string>;
  isGraphLocked: boolean; // Prevents graph switching during commands
  shouldFitView: boolean; // Triggers fitView when a graph is loaded

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Omit<Node, 'id'>) => void;
  updateNode: (id: string, updates: Partial<Node['data']>) => void;
  updateNodePosition: (id: string, position: { x: number; y: number; z?: number }) => void;
  deleteNode: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  addEdge: (edge: Omit<Edge, 'id'>) => void;
  toggleEdge: (edgeId: string) => void;
  exportGraph: () => { nodes: Node[]; edges: Edge[] };
  loadGraph: (data: string) => void;
  generatePrompt: () => string;
  clearGraph: () => void;
  clearGraphView: () => void;
  publishGraph: (name: string, description?: string) => Promise<GraphState['currentGraph']>;
  updateGraph: (
    graphId: string,
    name: string,
    description?: string
  ) => Promise<GraphState['currentGraph']>;
  loadGraphData: (data: { nodes: Node[]; edges: Edge[] }) => void;
  setCurrentGraph: (graph: GraphState['currentGraph']) => void;
  setLastOpenedGraph: (workspacePath: string, graphId: string) => void;
  getLastOpenedGraph: (workspacePath: string) => string | undefined;
  removeLastOpenedGraph: (workspacePath: string, graphId: string) => void;
  setGraphLocked: (locked: boolean) => void;
  setShouldFitView: (should: boolean) => void;
}

export const useGraphStore = create<GraphState>((set, get) => {
  const initialData = loadFromStorage();

  return {
    nodes: initialData.nodes,
    edges: initialData.edges,
    selectedNode: null,
    currentGraph: null,
    lastOpenedGraphByWorkspace: initialData.lastOpenedGraphByWorkspace,
    isGraphLocked: false,
    shouldFitView: false,

    setNodes: (nodes) => {
      set({ nodes });
      saveToStorage(nodes, get().edges);
    },

    setEdges: (edges) => {
      set({ edges });
      saveToStorage(get().nodes, edges);
    },

    addNode: (nodeData) => {
      const historyStore = useHistoryStore.getState();
      const currentState = get();
      historyStore.pushState(currentState.nodes, currentState.edges);

      const id = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const node: Node = {
        ...nodeData,
        id,
        position: nodeData.position || { x: 100, y: 100 },
      };
      set((state) => {
        const newNodes = [...state.nodes, node];
        saveToStorage(newNodes, state.edges);
        return { nodes: newNodes };
      });
    },

    updateNode: (id, updates) => {
      set((state) => {
        const newNodes = state.nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
        );

        saveToStorage(newNodes, state.edges);
        return { nodes: newNodes };
      });
    },

    updateNodePosition: (id, position) => {
      set((state) => {
        const nodeExists = state.nodes.find((node) => node.id === id);
        if (!nodeExists) {
          return state;
        }

        const newNodes = state.nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                position: { x: position.x, y: position.y, z: position.z ?? node.position.z ?? 0 },
              }
            : node
        );
        saveToStorage(newNodes, state.edges);
        return { nodes: newNodes };
      });
    },

    deleteNode: (id) => {
      const historyStore = useHistoryStore.getState();
      const currentState = get();
      historyStore.pushState(currentState.nodes, currentState.edges);

      set((state) => {
        const newNodes = state.nodes.filter((node) => node.id !== id);
        const newEdges = state.edges.filter((edge) => edge.source !== id && edge.target !== id);
        saveToStorage(newNodes, newEdges);
        return {
          nodes: newNodes,
          edges: newEdges,
          selectedNode: state.selectedNode === id ? null : state.selectedNode,
        };
      });
    },

    setSelectedNode: (id) => {
      set((state) => {
        let updatedNodes = state.nodes;
        if (id) {
          const distances = calculateDistances(state.nodes, state.edges, id);
          updatedNodes = state.nodes.map((node) => ({
            ...node,
            position: {
              ...node.position,
              z: distances[node.id] === Infinity ? 0 : distances[node.id] * -50,
            },
          }));
        } else {
          updatedNodes = state.nodes.map((node) => ({
            ...node,
            position: {
              ...node.position,
              z: 0,
            },
          }));
        }
        saveToStorage(updatedNodes, state.edges);
        return {
          selectedNode: id,
          nodes: updatedNodes,
        };
      });
    },

    addEdge: (edgeData) => {
      const historyStore = useHistoryStore.getState();
      const currentState = get();
      historyStore.pushState(currentState.nodes, currentState.edges);

      const id = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const edge: Edge = { ...edgeData, id };
      set((state) => {
        const newEdges = [...state.edges, edge];
        saveToStorage(state.nodes, newEdges);
        return { edges: newEdges };
      });
    },

    toggleEdge: (edgeId: string) => {
      const historyStore = useHistoryStore.getState();
      const currentState = get();
      historyStore.pushState(currentState.nodes, currentState.edges);

      set((state) => {
        const newEdges = state.edges.filter((edge) => edge.id !== edgeId);
        saveToStorage(state.nodes, newEdges);
        return { edges: newEdges };
      });
    },

    exportGraph: () => {
      const state = get();
      return { nodes: state.nodes, edges: state.edges };
    },

    loadGraph: (data) => {
      try {
        const parsed = JSON.parse(data);
        const nodes = parsed.nodes || [];
        const edges = parsed.edges || [];
        set({
          nodes,
          edges,
          selectedNode: null,
        });
        saveToStorage(nodes, edges);
      } catch (error) {
        console.error('Error loading graph:', error);
      }
    },

    generatePrompt: () => {
      const state = get();
      const activeNodes = state.nodes.filter((node) => node.data.active);
      const nodeTexts = activeNodes
        .map((node) => `${node.data.label}: ${node.data.content}`)
        .join('\n\n');

      return nodeTexts || 'No active context found.';
    },

    clearGraph: () => {
      set({
        nodes: [],
        edges: [],
        selectedNode: null,
      });
      saveToStorage([], []);

      localStorage.removeItem('reactflow-viewport');
    },

    clearGraphView: () => {
      set({
        nodes: [],
        edges: [],
        selectedNode: null,
      });
      localStorage.removeItem('reactflow-viewport');
    },

    publishGraph: async (name: string, description?: string) => {
      const state = get();
      const currentGraph = state.currentGraph || {
        id: crypto.randomUUID(),
        name,
        description: description || '',
      };

      set({ currentGraph });
      saveToStorage(state.nodes, state.edges);

      return currentGraph;
    },

    updateGraph: async (graphId: string, name: string, description?: string) => {
      const state = get();

      set((state) => ({
        currentGraph:
          state.currentGraph && state.currentGraph.id === graphId
            ? {
                ...state.currentGraph,
                name: name,
                description: description || state.currentGraph.description,
              }
            : state.currentGraph,
      }));

      saveToStorage(state.nodes, state.edges);

      return get().currentGraph;
    },

    loadGraphData: (data) => {
      const nodes = data.nodes || [];
      const edges = data.edges || [];
      set({
        nodes,
        edges,
        selectedNode: null,
      });
      saveToStorage(nodes, edges);
    },

    setCurrentGraph: (graph) => {
      set({ currentGraph: graph });
      saveToStorage(get().nodes, get().edges);
    },

    setLastOpenedGraph: (workspacePath: string, graphId: string) => {
      set((state) => {
        const updated = { ...state.lastOpenedGraphByWorkspace, [workspacePath]: graphId };
        saveLastOpenedGraphs(updated);
        return { lastOpenedGraphByWorkspace: updated };
      });
    },

    getLastOpenedGraph: (workspacePath: string) => {
      return get().lastOpenedGraphByWorkspace[workspacePath];
    },

    removeLastOpenedGraph: (workspacePath: string, graphId: string) => {
      set((state) => {
        const updated = { ...state.lastOpenedGraphByWorkspace };
        if (updated[workspacePath] === graphId) {
          delete updated[workspacePath];
        }
        saveLastOpenedGraphs(updated);
        return { lastOpenedGraphByWorkspace: updated };
      });
    },

    setGraphLocked: (locked: boolean) => {
      set({ isGraphLocked: locked });
    },

    setShouldFitView: (should: boolean) => {
      set({ shouldFitView: should });
    },
  };
});
