import React, { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  ConnectionMode,
} from 'reactflow';
import type { Connection, Edge, NodeChange, EdgeChange, Viewport } from 'reactflow';

import 'reactflow/dist/style.css';

import ContextNode from './ContextNode';
import GraphReferenceNode from './GraphReferenceNode';
import CustomControls from '../layout/CustomControls';
import { useGraphStore } from '../../store/graphStore';
import { useHistoryStore } from '../../store/historyStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useGraphHandlers } from '@/shortcuts/handlers/graphHandlers';
import { useViewHandlers } from '@/shortcuts/handlers/viewHandlers';

const nodeTypes = {
  contextNode: ContextNode,
  graphReferenceNode: GraphReferenceNode,
};

interface FlowProps {
  is3DView: boolean;
  setIs3DView: (is3D: boolean) => void;
  saveGraph?: (graphId: string, graphData: any) => Promise<boolean>;
  refreshGraphs?: () => Promise<void>;
  deleteGraph?: (graphId: string) => Promise<boolean>;
  isForced3D?: boolean;
}

const Flow: React.FC<FlowProps> = ({
  is3DView,
  setIs3DView,
  saveGraph: saveGraphToWorkspace,
  refreshGraphs,
  deleteGraph: deleteGraphFromWorkspace,
  isForced3D = false,
}) => {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    updateNodePosition,
    addEdge: addStoreEdge,
    toggleEdge,
    deleteNode: deleteNodeFromStore,
    setEdges: setStoreEdges,
    currentGraph,
    shouldFitView,
    setShouldFitView,
  } = useGraphStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [initialized, setInitialized] = useState(false);

  const graphHandlers = useGraphHandlers({
    onSaveToWorkspace: saveGraphToWorkspace,
    onRefreshGraphs: refreshGraphs,
    onDeleteFromWorkspace: deleteGraphFromWorkspace,
  });
  const viewHandlers = useViewHandlers();

  useKeyboardShortcuts({
    shortcuts: {
      'graph.save': graphHandlers.handleSave,
      'graph.new': graphHandlers.handleNew,
      'graph.delete': graphHandlers.handleDelete,
      'graph.export': graphHandlers.handleExport,
      'graph.import': graphHandlers.handleImport,
      'view.zoom-in': () => zoomIn({ duration: 200 }),
      'view.zoom-out': () => zoomOut({ duration: 200 }),
      'view.fit-to-screen': () => fitView({ padding: 0.2, duration: 300 }),
      'view.zoom-reset': () => fitView({ duration: 200 }),
      'view.pan-up': viewHandlers.handlePanUp,
      'view.pan-down': viewHandlers.handlePanDown,
      'view.pan-left': viewHandlers.handlePanLeft,
      'view.pan-right': viewHandlers.handlePanRight,
    },
    enabled: true,
  });

  useEffect(() => {
    if (!initialized) {
      setNodes(storeNodes);
      setInitialized(true);
    } else {
      setNodes((currentNodes) => {
        const updatedNodes = storeNodes.map((storeNode) => {
          const existingNode = currentNodes.find((n) => n.id === storeNode.id);
          if (existingNode) {
            const storePos = storeNode.position;
            const localPos = existingNode.position;
            const positionChanged =
              Math.abs(storePos.x - localPos.x) > 0.1 || Math.abs(storePos.y - localPos.y) > 0.1;

            return {
              ...storeNode,

              position: positionChanged ? storeNode.position : existingNode.position,
            };
          }

          return storeNode;
        });

        return updatedNodes;
      });
    }
  }, [storeNodes, setNodes, initialized]);

  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges, setEdges]);

  const [prevNodeCount, setPrevNodeCount] = useState(0);

  useEffect(() => {
    if (initialized && nodes.length > 0) {
      const nodeCountChange = Math.abs(nodes.length - prevNodeCount);
      const isSignificantChange = nodeCountChange > 3;
      const isFirstLoad = prevNodeCount === 0 && nodes.length > 1;

      if (isSignificantChange || isFirstLoad) {
        setTimeout(() => {
          fitView({
            padding: 0.2,
            duration: 500,
          });
        }, 100);
      }

      setPrevNodeCount(nodes.length);
    }
  }, [initialized, nodes.length, currentGraph?.id, fitView, prevNodeCount]);

  useEffect(() => {
    const handleFocusActiveNodes = (event: CustomEvent) => {
      const { nodeIds } = event.detail;

      if (!nodeIds || nodeIds.length === 0) return;

      const activeNodes = nodes.filter((n) => nodeIds.includes(n.id));

      if (activeNodes.length === 0) {
        console.warn('[GraphCanvas] ⚠️ No active nodes found to focus');
        return;
      }

      setTimeout(() => {
        try {
          fitView({
            nodes: activeNodes.map((n) => ({ id: n.id })),
            padding: 0.2,
            duration: 800,
            maxZoom: 1.2,
            includeHiddenNodes: false,
          });
        } catch (error) {
          console.error('[GraphCanvas] ❌ Error executing fitView:', error);
        }
      }, 300);
    };

    window.addEventListener('focus-active-nodes', handleFocusActiveNodes as EventListener);

    return () => {
      window.removeEventListener('focus-active-nodes', handleFocusActiveNodes as EventListener);
    };
  }, [nodes, fitView]);

  useEffect(() => {
    if (shouldFitView && nodes.length > 0) {
      setTimeout(() => {
        try {
          fitView({ padding: 0.2, duration: 500, maxZoom: 1.5 });
          setShouldFitView(false);
        } catch (error) {
          console.error('[GraphCanvas] ❌ Error executing fitView on graph load:', error);
        }
      }, 150);
    }
  }, [shouldFitView, nodes.length, fitView, setShouldFitView]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach((change) => {
        if (change.type === 'remove') {
          deleteNodeFromStore(change.id);
        }
      });

      onNodesChange(changes);
    },
    [onNodesChange, deleteNodeFromStore]
  );

  const onNodeDragStart = useCallback(
    (_: React.MouseEvent, node: { id: string; position: { x: number; y: number } }) => {
      const historyStore = useHistoryStore.getState();
      historyStore.pushState(storeNodes, storeEdges);
    },
    [storeNodes, storeEdges]
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: { id: string; position: { x: number; y: number } }) => {
      updateNodePosition(node.id, node.position);
    },
    [updateNodePosition]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      changes.forEach((change) => {
        if (change.type === 'remove') {
          setStoreEdges(storeEdges.filter((edge) => edge.id !== change.id));
        }
      });

      onEdgesChange(changes);
    },
    [onEdgesChange, setStoreEdges, storeEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        addStoreEdge({
          source: params.source,
          target: params.target,
          type: params.sourceHandle || undefined,
        });
      }
    },
    [addStoreEdge]
  );

  const isValidConnection = useCallback(() => {
    return true;
  }, []);

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      toggleEdge(edge.id);
    },
    [toggleEdge]
  );

  const onMoveEnd = useCallback((_event: unknown, viewport: Viewport) => {
    localStorage.setItem('reactflow-viewport', JSON.stringify(viewport));
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      try {
        const data = JSON.parse(event.dataTransfer.getData('application/json'));

        if (data.type === 'graph-reference') {
          const reactFlowBounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
          const position = {
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
          };

          const newNode = {
            type: 'graphReferenceNode',
            position,
            data: {
              label: data.graphName,
              content: `Reference to graph: ${data.graphName}`,
              active: true,
              graphId: data.graphId,
              graphName: data.graphName,
              isExpanded: false,
            },
          };

          const { addNode } = useGraphStore.getState();
          addNode(newNode);
        }
      } catch (error) {
        console.error('Error handling drop:', error);
      }
    },
    [addStoreEdge]
  );

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  return (
    <div className="flex-1 h-full relative overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onMoveEnd={onMoveEnd}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        attributionPosition="bottom-left"
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={4}
        fitView={false}
        fitViewOptions={{ padding: 0.1 }}
        connectionMode={ConnectionMode.Loose}
        isValidConnection={isValidConnection}
        multiSelectionKeyCode={null}
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <CustomControls is3DView={is3DView} setIs3DView={setIs3DView} isForced3D={isForced3D} />
        <MiniMap
          nodeStrokeColor="hsl(var(--primary))"
          nodeColor="hsl(var(--background))"
          nodeBorderRadius={8}
          className="!bg-background border border-border shadow-sm"
          maskColor="hsl(var(--background) / 0.8)"
          position="top-left"
        />
      </ReactFlow>
    </div>
  );
};

const GraphCanvas: React.FC<FlowProps> = ({
  is3DView,
  setIs3DView,
  saveGraph,
  refreshGraphs,
  deleteGraph,
  isForced3D,
}) => {
  return (
    <ReactFlowProvider>
      <Flow
        is3DView={is3DView}
        setIs3DView={setIs3DView}
        saveGraph={saveGraph}
        refreshGraphs={refreshGraphs}
        deleteGraph={deleteGraph}
        isForced3D={isForced3D}
      />
    </ReactFlowProvider>
  );
};

export default GraphCanvas;
