import { useHistoryStore } from '@/store/historyStore';
import { useGraphStore } from '@/store/graphStore';
import type { Node } from '@/store/graphStore';

export const createEditHandlers = () => {
  const historyStore = useHistoryStore.getState();
  const graphStore = useGraphStore.getState();

  return {
    undo: () => {
      if (!historyStore.canUndo()) {
        return;
      }

      const previousState = historyStore.undo();

      if (previousState) {
        graphStore.setNodes(previousState.nodes);
        graphStore.setEdges(previousState.edges);
      }
    },

    redo: () => {
      if (!historyStore.canRedo()) {
        return;
      }

      const nextState = historyStore.redo();

      if (nextState) {
        graphStore.setNodes(nextState.nodes);
        graphStore.setEdges(nextState.edges);
      }
    },

    copy: () => {
      const { nodes, selectedNode } = graphStore;

      if (!selectedNode) {
        return;
      }

      const nodeToCopy = nodes.find((n) => n.id === selectedNode);

      if (nodeToCopy) {
        const clipboardData = JSON.stringify({
          nodes: [nodeToCopy],
          type: 'graph-nodes',
        });

        navigator.clipboard
          .writeText(clipboardData)
          .then(() => {})
          .catch((err) => {
            console.error('Failed to copy to clipboard:', err);
          });
      }
    },

    paste: async () => {
      try {
        const clipboardText = await navigator.clipboard.readText();
        const clipboardData = JSON.parse(clipboardText);

        if (clipboardData.type === 'graph-nodes' && clipboardData.nodes) {
          const { nodes } = graphStore;

          const newNodes: Node[] = clipboardData.nodes.map((node: Node) => ({
            ...node,
            id: `node-${Date.now()}-${Math.random()}`,
            position: {
              x: node.position.x + 50,
              y: node.position.y + 50,
              z: node.position.z,
            },
          }));

          historyStore.pushState(nodes, graphStore.edges);

          graphStore.setNodes([...nodes, ...newNodes]);
        }
      } catch (err) {
        console.error('Failed to paste:', err);
      }
    },

    cut: () => {
      const { nodes, edges, selectedNode } = graphStore;

      if (!selectedNode) {
        return;
      }

      const nodeToCut = nodes.find((n) => n.id === selectedNode);

      if (nodeToCut) {
        const clipboardData = JSON.stringify({
          nodes: [nodeToCut],
          type: 'graph-nodes',
        });

        navigator.clipboard
          .writeText(clipboardData)
          .then(() => {
            historyStore.pushState(nodes, edges);

            const newNodes = nodes.filter((n) => n.id !== selectedNode);
            const newEdges = edges.filter(
              (e) => e.source !== selectedNode && e.target !== selectedNode
            );

            graphStore.setNodes(newNodes);
            graphStore.setEdges(newEdges);
            graphStore.setSelectedNode(null);
          })
          .catch((err) => {
            console.error('Failed to cut:', err);
          });
      }
    },
  };
};

export const useEditHandlers = () => {
  return createEditHandlers();
};
