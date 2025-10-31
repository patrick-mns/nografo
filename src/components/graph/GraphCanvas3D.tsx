import React, { useMemo, useRef, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { useGraphStore } from '../../store/graphStore';
import { useThemeStore } from '../../store/themeStore';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import { Button } from '../ui/button';
import { ZoomIn, ZoomOut, Focus, Square, Loader2 } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useGraphHandlers } from '@/shortcuts/handlers/graphHandlers';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useToast } from '@/hooks/useToast';

interface GraphNode {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  active: boolean;
  type?: string;
  isExpanded?: boolean;
}

interface GraphCanvas3DProps {
  is3DView: boolean;
  setIs3DView: (is3D: boolean) => void;
  isChatPanelOpen?: boolean;
  isSidePanelOpen?: boolean;
  saveGraph?: (graphId: string, graphData: any) => Promise<boolean>;
  refreshGraphs?: () => Promise<void>;
  deleteGraph?: (graphId: string) => Promise<boolean>;
  isForced3D?: boolean;
}

const GraphCanvas3D: React.FC<GraphCanvas3DProps> = ({
  setIs3DView,
  isChatPanelOpen = false,
  isSidePanelOpen = false,
  saveGraph: saveGraphToWorkspace,
  refreshGraphs,
  deleteGraph: deleteGraphFromWorkspace,
  isForced3D = false,
}) => {
  const {
    nodes,
    edges,
    selectedNode,
    currentGraph,
    loadGraph: loadGraphToStore,
    setCurrentGraph,
    isGraphLocked,
    shouldFitView,
    setShouldFitView,
  } = useGraphStore();
  const { color, mode, dynamicNodeSizing } = useThemeStore();
  const { loadGraph: loadGraphFromWorkspace } = useWorkspace();
  const { toast } = useToast();
  const fgRef = useRef<any>(null);
  const [prevNodeCount3D, setPrevNodeCount3D] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lodEnabled, setLodEnabled] = useState(false);
  const throttleDelay = useRef(16);
  const lastClickTime = useRef<{ nodeId: string; time: number } | null>(null);

  const LARGE_GRAPH_THRESHOLD = 500;
  const VERY_LARGE_GRAPH_THRESHOLD = 1000;
  const LOD_DISTANCE_THRESHOLD = 200;
  const DOUBLE_CLICK_DELAY = 300;

  const MIN_NODE_SIZE = 2;
  const MAX_NODE_SIZE = 6;
  const DEFAULT_NODE_SIZE = 3;

  const graphHandlers = useGraphHandlers({
    onSaveToWorkspace: saveGraphToWorkspace,
    onRefreshGraphs: refreshGraphs,
    onDeleteFromWorkspace: deleteGraphFromWorkspace,
  });

  const calculateNodeSize = (nodeName: string): number => {
    if (!dynamicNodeSizing) {
      return DEFAULT_NODE_SIZE;
    }

    const wordCount = nodeName.trim().split(/\s+/).length;
    const scaleFactor = Math.min(Math.max(wordCount, 1), 4);
    const size = MIN_NODE_SIZE + (scaleFactor - 1) * ((MAX_NODE_SIZE - MIN_NODE_SIZE) / 3);
    return size;
  };

  const PAN_AMOUNT = 30;

  const handlePan3DUp = () => {
    if (fgRef.current) {
      const camera = fgRef.current.camera();
      camera.position.y += PAN_AMOUNT;
      fgRef.current.renderer().render(fgRef.current.scene(), camera);
    }
  };

  const handlePan3DDown = () => {
    if (fgRef.current) {
      const camera = fgRef.current.camera();
      camera.position.y -= PAN_AMOUNT;
      fgRef.current.renderer().render(fgRef.current.scene(), camera);
    }
  };

  const handlePan3DLeft = () => {
    if (fgRef.current) {
      const camera = fgRef.current.camera();
      camera.position.x -= PAN_AMOUNT;
      fgRef.current.renderer().render(fgRef.current.scene(), camera);
    }
  };

  const handlePan3DRight = () => {
    if (fgRef.current) {
      const camera = fgRef.current.camera();
      camera.position.x += PAN_AMOUNT;
      fgRef.current.renderer().render(fgRef.current.scene(), camera);
    }
  };

  const handleZoomIn3D = () => {
    if (fgRef.current) {
      const camera = fgRef.current.camera();
      const factor = 0.8;
      camera.position.multiplyScalar(factor);
      fgRef.current.renderer().render(fgRef.current.scene(), camera);
    }
  };

  const handleZoomOut3D = () => {
    if (fgRef.current) {
      const camera = fgRef.current.camera();
      const factor = 1.25;
      camera.position.multiplyScalar(factor);
      fgRef.current.renderer().render(fgRef.current.scene(), camera);
    }
  };

  const handleCenterGraph3D = () => {
    if (fgRef.current && nodes.length > 0) {
      console.log('[GraphCanvas3D] 🎯 Centering graph with', nodes.length, 'nodes');

      let graphNodes: GraphNode[] = [];

      try {
        const graphData = fgRef.current.graphData ? fgRef.current.graphData() : null;
        if (graphData && graphData.nodes && graphData.nodes.length > 0) {
          graphNodes = graphData.nodes;
          console.log('[GraphCanvas3D] 📊 Using ForceGraph3D positions');
        }
      } catch (error) {
        console.warn('[GraphCanvas3D] ⚠️ Could not get graphData, using store positions:', error);
      }

      if (graphNodes.length === 0) {
        graphNodes = graphData.nodes;
        console.log('[GraphCanvas3D] 📊 Using store positions');
      }

      if (graphNodes.length === 0) {
        console.warn('[GraphCanvas3D] ⚠️ No nodes to center');
        return;
      }

      const centerX =
        graphNodes.reduce((sum: number, node: any) => sum + (node.x || 0), 0) / graphNodes.length;
      const centerY =
        graphNodes.reduce((sum: number, node: any) => sum + (node.y || 0), 0) / graphNodes.length;
      const centerZ =
        graphNodes.reduce((sum: number, node: any) => sum + (node.z || 0), 0) / graphNodes.length;

      const maxDistance = Math.max(
        ...graphNodes.map((node: any) => {
          const dx = (node.x || 0) - centerX;
          const dy = (node.y || 0) - centerY;
          const dz = (node.z || 0) - centerZ;
          return Math.sqrt(dx * dx + dy * dy + dz * dz);
        }),
        50
      );

      const cameraDistance = Math.max(maxDistance * 2.5, 200);

      console.log('[GraphCanvas3D] 📍 Center:', { centerX, centerY, centerZ });
      console.log('[GraphCanvas3D] 📏 Max distance:', maxDistance);
      console.log('[GraphCanvas3D] 📷 Camera distance:', cameraDistance);

      const cameraPos = {
        x: centerX + cameraDistance * 0.5,
        y: centerY + cameraDistance * 0.5,
        z: centerZ + cameraDistance * 0.7,
      };

      const lookAt = { x: centerX, y: centerY, z: centerZ };

      console.log('[GraphCanvas3D] 🎬 Moving camera to:', cameraPos, 'Looking at:', lookAt);

      fgRef.current.cameraPosition(cameraPos, lookAt, 1000);

      console.log('[GraphCanvas3D] ✅ Camera movement initiated');
    }
  };

  useKeyboardShortcuts({
    shortcuts: {
      'graph.save': graphHandlers.handleSave,
      'graph.new': graphHandlers.handleNew,
      'graph.delete': graphHandlers.handleDelete,
      'graph.export': graphHandlers.handleExport,
      'graph.import': graphHandlers.handleImport,
      'view.zoom-in': handleZoomIn3D,
      'view.zoom-out': handleZoomOut3D,
      'view.fit-to-screen': handleCenterGraph3D,
      'view.zoom-reset': handleCenterGraph3D,
      'view.pan-up': handlePan3DUp,
      'view.pan-down': handlePan3DDown,
      'view.pan-left': handlePan3DLeft,
      'view.pan-right': handlePan3DRight,
    },
    enabled: true,
  });

  const getPrimaryColor = () => {
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryHsl = computedStyle.getPropertyValue('--primary').trim();

    if (primaryHsl) {
      const [h, s, l] = primaryHsl.split(' ').map((v) => parseFloat(v.replace('%', '')));
      return `hsl(${h}, ${s}%, ${l}%)`;
    }

    return '#a3e635';
  };

  const getPrimaryColorHex = () => {
    const hsl = getPrimaryColor();

    const tempDiv = document.createElement('div');
    tempDiv.style.color = hsl;
    document.body.appendChild(tempDiv);
    const rgb = getComputedStyle(tempDiv).color;
    document.body.removeChild(tempDiv);

    const match = rgb.match(/\d+/g);
    if (match) {
      const r = parseInt(match[0]);
      const g = parseInt(match[1]);
      const b = parseInt(match[2]);
      return (r << 16) | (g << 8) | b;
    }

    return 0xa3e635;
  };

  const getBackgroundColor = () => {
    const computedStyle = getComputedStyle(document.documentElement);
    const bgColor = computedStyle.getPropertyValue('--background').trim();

    if (bgColor) {
      const [h, s, l] = bgColor.split(' ').map((v) => parseFloat(v.replace('%', '')));
      return `hsla(${h}, ${s}%, ${l}%, 0.1)`;
    }

    return document.documentElement.classList.contains('dark')
      ? 'rgba(10, 10, 10, 0.1)'
      : 'rgba(255, 255, 255, 0.1)';
  };

  const getLinkColor = () => {
    return document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000';
  };

  const getForegroundColor = () => {
    const computedStyle = getComputedStyle(document.documentElement);
    const foregroundHsl = computedStyle.getPropertyValue('--foreground').trim();

    if (foregroundHsl) {
      const [h, s, l] = foregroundHsl.split(' ').map((v) => parseFloat(v.replace('%', '')));
      return `hsl(${h}, ${s}%, ${l}%)`;
    }

    return document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000';
  };

  const [backgroundColor, setBackgroundColor] = useState(getBackgroundColor());
  const [linkColor, setLinkColor] = useState(getLinkColor());
  const [primaryColor, setPrimaryColor] = useState(getPrimaryColor());
  const [primaryColorHex, setPrimaryColorHex] = useState(getPrimaryColorHex());
  const [foregroundColor, setForegroundColor] = useState(getForegroundColor());

  const getAvailableDimensions = () => {
    const container = document.getElementById('graph-3d-container');
    if (container && container.parentElement) {
      const rect = container.parentElement.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      return { width, height };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    return { width, height };
  };

  const [dimensions, setDimensions] = useState(getAvailableDimensions());

  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        requestAnimationFrame(() => {
          setDimensions(getAvailableDimensions());
        });
      }, 150);
    };

    setTimeout(() => {
      setDimensions(getAvailableDimensions());
    }, 50);

    window.addEventListener('resize', handleResize);

    const container = document.getElementById('graph-3d-container');
    if (container && container.parentElement) {
      const resizeObserver = new ResizeObserver(() => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          requestAnimationFrame(() => {
            setDimensions(getAvailableDimensions());
          });
        }, 100);
      });
      resizeObserver.observe(container.parentElement);

      return () => {
        clearTimeout(resizeTimeout);
        window.removeEventListener('resize', handleResize);
        resizeObserver.disconnect();
      };
    }

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [isChatPanelOpen, isSidePanelOpen, nodes.length]);

  React.useEffect(() => {
    const updateColors = () => {
      setBackgroundColor(getBackgroundColor());
      setLinkColor(getLinkColor());
      setPrimaryColor(getPrimaryColor());
      setPrimaryColorHex(getPrimaryColorHex());
      setForegroundColor(getForegroundColor());
    };

    updateColors();

    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    return () => observer.disconnect();
  }, [color, mode]);

  const graphData = useMemo(() => {
    const nodeCount = nodes.length;
    if (nodeCount > LARGE_GRAPH_THRESHOLD) {
      setIsLoading(true);

      setLodEnabled(nodeCount > VERY_LARGE_GRAPH_THRESHOLD);

      if (nodeCount > VERY_LARGE_GRAPH_THRESHOLD) {
        throttleDelay.current = 50;
      } else {
        throttleDelay.current = 33;
      }

      setTimeout(() => setIsLoading(false), 1000);
    } else {
      setIsLoading(false);
      setLodEnabled(false);
      throttleDelay.current = 16;
    }

    return {
      nodes: nodes.map((node) => ({
        id: node.id,
        name: node.data.label,
        x: node.position.x * 1,
        y: node.position.y * 1,
        z: (node.position.z || 0) * 1,
        active: node.data.active,
        type: node.type,
        isExpanded: node.data.isExpanded,
      })),
      links: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      })),
    };
  }, [nodes, edges]);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('center', null);
      fgRef.current.d3Force('charge', null);

      const simulation = fgRef.current.d3Force('simulation');
      if (simulation) {
        let lastTick = Date.now();
        simulation.on('tick', () => {
          const now = Date.now();
          if (now - lastTick > throttleDelay.current) {
            lastTick = now;
            fgRef.current?.refresh?.();
          }
        });
      }
    }

    const style = document.createElement('style');
    style.textContent = `
            #graph-3d-container {
        width: 100% !important;
        height: 100% !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        overflow: hidden !important;
        z-index: 1 !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      #graph-3d-container > div:not(.controls-3d) {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 1 !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      #graph-3d-container canvas {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 1 !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      #graph-3d-container .controls-3d {
        position: absolute !important;
        bottom: 0 !important;
        left: 0 !important;
        margin: 15px !important;
        z-index: 9999 !important;
        pointer-events: auto !important;
        transition: none !important;
      }
      #graph-3d-container .controls-3d * {
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);

      if (fgRef.current) {
        try {
          const scene = fgRef.current.scene();
          const renderer = fgRef.current.renderer();

          scene.traverse((object: any) => {
            if (object.geometry) {
              object.geometry.dispose();
            }
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((material: any) => material.dispose());
              } else {
                object.material.dispose();
              }
            }

            if (object.material?.map) {
              object.material.map.dispose();
            }
          });

          renderer.dispose();
          renderer.forceContextLoss();

          while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
          }
        } catch (error) {
          console.warn('Error cleaning up 3D resources:', error);
        }
      }
    };
  }, []);

  const handleNodeClick = async (node: GraphNode) => {
    const now = Date.now();
    const lastClick = lastClickTime.current;

    if (lastClick && lastClick.nodeId === node.id && now - lastClick.time < DOUBLE_CLICK_DELAY) {
      if (node.type === 'graphReferenceNode') {
        if (isGraphLocked) {
          toast({
            variant: 'destructive',
            title: 'Graph Locked',
            description: 'Please wait for the current command to complete before switching graphs.',
          });
          lastClickTime.current = null;
          return;
        }

        const fullNode = nodes.find((n) => n.id === node.id);
        const graphId = fullNode?.data?.graphId;
        const graphName = fullNode?.data?.graphName;

        if (!graphId) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No graph selected for this reference',
          });
          lastClickTime.current = null;
          return;
        }

        try {
          const graphData = (await loadGraphFromWorkspace(graphId)) as any;

          if (!graphData || !graphData.nodes || !graphData.edges) {
            throw new Error('Invalid graph data');
          }

          setCurrentGraph({
            id: graphId,
            name: graphData.name || graphName || graphId,
            description: graphData.description || '',
          });

          loadGraphToStore(JSON.stringify(graphData));

          setTimeout(() => {
            useGraphStore.getState().setShouldFitView(true);
          }, 100);

          toast({
            title: 'Graph Loaded',
            description: `Graph loaded successfully: ${graphName}`,
          });
        } catch (error) {
          console.error('Error loading referenced graph:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: `Failed to load graph: ${graphName}`,
          });
        }
      }

      lastClickTime.current = null;
    } else {
      lastClickTime.current = { nodeId: node.id, time: now };

      setTimeout(() => {
        if (lastClickTime.current?.nodeId === node.id) {
          lastClickTime.current = null;
        }
      }, DOUBLE_CLICK_DELAY);
    }
  };

  const handleZoomIn = () => {
    if (fgRef.current) {
      const camera = fgRef.current.camera();
      const factor = 0.8;
      camera.position.multiplyScalar(factor);
      fgRef.current.renderer().render(fgRef.current.scene(), camera);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      const camera = fgRef.current.camera();
      const factor = 1.25;
      camera.position.multiplyScalar(factor);
      fgRef.current.renderer().render(fgRef.current.scene(), camera);
    }
  };

  const handleCenterGraph = () => {
    if (fgRef.current && nodes.length > 0) {
      console.log(
        '[GraphCanvas3D] 🎯 Centering graph (handleCenterGraph) with',
        nodes.length,
        'nodes'
      );

      let graphNodes: GraphNode[] = [];

      try {
        const graphDataFromFG = fgRef.current.graphData ? fgRef.current.graphData() : null;
        if (graphDataFromFG && graphDataFromFG.nodes && graphDataFromFG.nodes.length > 0) {
          graphNodes = graphDataFromFG.nodes;
          console.log('[GraphCanvas3D] 📊 Using ForceGraph3D positions');
        }
      } catch (error) {
        console.warn('[GraphCanvas3D] ⚠️ Could not get graphData, using store positions:', error);
      }

      if (graphNodes.length === 0) {
        graphNodes = graphData.nodes;
        console.log('[GraphCanvas3D] 📊 Using store positions');
      }

      if (graphNodes.length === 0) {
        console.warn('[GraphCanvas3D] ⚠️ No nodes to center');
        return;
      }

      const centerX = graphNodes.reduce((sum, node) => sum + (node.x || 0), 0) / graphNodes.length;
      const centerY = graphNodes.reduce((sum, node) => sum + (node.y || 0), 0) / graphNodes.length;
      const centerZ = graphNodes.reduce((sum, node) => sum + (node.z || 0), 0) / graphNodes.length;

      const maxDistance = Math.max(
        ...graphNodes.map((node) => {
          const dx = (node.x || 0) - centerX;
          const dy = (node.y || 0) - centerY;
          const dz = (node.z || 0) - centerZ;
          return Math.sqrt(dx * dx + dy * dy + dz * dz);
        }),
        50
      );

      const cameraDistance = Math.max(maxDistance * 2.5, 200);

      console.log('[GraphCanvas3D] 📍 Center:', { centerX, centerY, centerZ });
      console.log('[GraphCanvas3D] 📏 Max distance:', maxDistance);
      console.log('[GraphCanvas3D] 📷 Camera distance:', cameraDistance);

      const cameraPos = {
        x: centerX + cameraDistance * 0.5,
        y: centerY + cameraDistance * 0.5,
        z: centerZ + cameraDistance * 0.7,
      };

      const lookAt = { x: centerX, y: centerY, z: centerZ };

      console.log('[GraphCanvas3D] 🎬 Moving camera to:', cameraPos, 'Looking at:', lookAt);

      fgRef.current.cameraPosition(cameraPos, lookAt, 1000);

      console.log('[GraphCanvas3D] ✅ Camera movement initiated');
    }
  };

  useEffect(() => {
    if (fgRef.current && nodes.length > 0) {
      const nodeCountChange = Math.abs(nodes.length - prevNodeCount3D);
      const isSignificantChange = nodeCountChange > 3;
      const isFirstLoad = prevNodeCount3D === 0 && nodes.length > 1;

      if (isSignificantChange || isFirstLoad) {
        const timer = setTimeout(() => {
          const centerX = nodes.reduce((sum, node) => sum + node.position.x, 0) / nodes.length;
          const centerY = nodes.reduce((sum, node) => sum + node.position.y, 0) / nodes.length;
          const centerZ =
            nodes.reduce((sum, node) => sum + (node.position.z || 0), 0) / nodes.length;

          const maxDistance = Math.max(
            ...nodes.map((node) => {
              const dx = node.position.x - centerX;
              const dy = node.position.y - centerY;
              const dz = (node.position.z || 0) - centerZ;
              return Math.sqrt(dx * dx + dy * dy + dz * dz);
            })
          );

          const cameraDistance = Math.max(maxDistance * 1.5, 200);

          if (fgRef.current) {
            fgRef.current.cameraPosition(
              { x: centerX, y: centerY + cameraDistance * 0.2, z: centerZ + cameraDistance * 0.8 },
              { x: centerX, y: centerY, z: centerZ },
              1500
            );
          }
        }, 100);

        return () => clearTimeout(timer);
      }

      setPrevNodeCount3D(nodes.length);
    }
  }, [nodes.length, currentGraph?.id, prevNodeCount3D]);

  useEffect(() => {
    if (fgRef.current && nodes.length > 0) {
      console.log('[GraphCanvas3D] 🎬 Component mounted - centering graph on initial load');
      const timer = setTimeout(() => {
        handleCenterGraph3D();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (shouldFitView && nodes.length > 0 && fgRef.current) {
      let hasCentered = false;

      const checkAndCenter = () => {
        if (hasCentered || !fgRef.current) return;

        try {
          const graphData = fgRef.current.graphData ? fgRef.current.graphData() : null;
          if (graphData && graphData.nodes && graphData.nodes.length > 0) {
            const hasValidPositions = graphData.nodes.some(
              (n: GraphNode) => n.x !== undefined && Math.abs(n.x) > 0.1
            );

            if (hasValidPositions) {
              hasCentered = true;
              handleCenterGraph3D();
              setShouldFitView(false);
            }
          }
        } catch (error) {
          hasCentered = true;
          setShouldFitView(false);
        }
      };

      const interval = setInterval(checkAndCenter, 0);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (!hasCentered) {
          hasCentered = true;
          handleCenterGraph3D();
          setShouldFitView(false);
        }
      }, 1000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldFitView, nodes.length]);

  useEffect(() => {
    const handleFocusActiveNodes = (event: CustomEvent) => {
      console.log('[GraphCanvas3D] 🎯 Focus active nodes event received', event.detail);

      const { nodeIds } = event.detail;

      if (!nodeIds || nodeIds.length === 0) {
        console.warn('[GraphCanvas3D] ⚠️ No nodeIds provided');
        return;
      }

      if (!fgRef.current) {
        console.warn('[GraphCanvas3D] ⚠️ fgRef.current is null');
        return;
      }

      setTimeout(() => {
        if (!fgRef.current) return;

        const fg = fgRef.current;

        try {
          let graphNodes: GraphNode[] = [];

          try {
            const graphDataFromFG = fg.graphData ? fg.graphData() : null;
            if (graphDataFromFG && graphDataFromFG.nodes && graphDataFromFG.nodes.length > 0) {
              graphNodes = graphDataFromFG.nodes as GraphNode[];
              console.log(
                '[GraphCanvas3D] 📊 Using ForceGraph3D data:',
                graphNodes.length,
                'nodes'
              );
            }
          } catch (error) {
            console.warn('[GraphCanvas3D] ⚠️ Could not get graphData from ForceGraph3D:', error);
          }

          if (graphNodes.length === 0) {
            graphNodes = graphData.nodes;
            console.log('[GraphCanvas3D] 📊 Using store data:', graphNodes.length, 'nodes');
          }

          console.log('[GraphCanvas3D] 📊 Total nodes available:', graphNodes.length);
          console.log('[GraphCanvas3D] 🔍 Looking for nodeIds:', nodeIds);
          console.log(
            '[GraphCanvas3D] 🔍 Sample node IDs from graph:',
            graphNodes.slice(0, 5).map((n) => n.id)
          );

          const activeNodes = graphNodes.filter((n: GraphNode) => nodeIds.includes(n.id));
          console.log(
            '[GraphCanvas3D] 🎯 Active nodes found:',
            activeNodes.length,
            activeNodes.map((n: GraphNode) => ({
              id: n.id,
              x: n.x,
              y: n.y,
              z: n.z,
            }))
          );

          if (activeNodes.length === 0) {
            console.warn('[GraphCanvas3D] ⚠️ No active nodes found to focus');
            console.warn(
              '[GraphCanvas3D] 🔍 Available node IDs:',
              graphNodes.map((n) => n.id)
            );
            console.warn('[GraphCanvas3D] 🔍 Requested node IDs:', nodeIds);
            return;
          }

          let minX = Infinity,
            maxX = -Infinity;
          let minY = Infinity,
            maxY = -Infinity;
          let minZ = Infinity,
            maxZ = -Infinity;

          activeNodes.forEach((node) => {
            const x = node.x || 0;
            const y = node.y || 0;
            const z = node.z || 0;

            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            minZ = Math.min(minZ, z);
            maxZ = Math.max(maxZ, z);
          });

          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          const centerZ = (minZ + maxZ) / 2;

          console.log('[GraphCanvas3D] 📍 Center position:', { centerX, centerY, centerZ });
          console.log('[GraphCanvas3D] 📦 Bounds:', {
            x: [minX, maxX],
            y: [minY, maxY],
            z: [minZ, maxZ],
          });

          if (isNaN(centerX) || isNaN(centerY) || isNaN(centerZ)) {
            console.warn('[GraphCanvas3D] ⚠️ Invalid center position calculated');
            return;
          }

          const sizeX = maxX - minX;
          const sizeY = maxY - minY;
          const sizeZ = maxZ - minZ;
          const maxSize = Math.max(sizeX, sizeY, sizeZ, 50);

          const padding = activeNodes.length === 1 ? 1.5 : 1.2;
          const cameraDistance = Math.max(maxSize * padding, 80);

          console.log('[GraphCanvas3D] 📷 Camera distance:', cameraDistance, 'Box size:', maxSize);

          const angle = Math.PI / 4;
          const targetPos = {
            x: centerX + cameraDistance * Math.cos(angle),
            y: centerY + cameraDistance * 0.5,
            z: centerZ + cameraDistance * Math.sin(angle),
          };
          const lookAt = { x: centerX, y: centerY, z: centerZ };

          console.log('[GraphCanvas3D] 🎬 Moving camera to:', targetPos, 'Looking at:', lookAt);

          fg.cameraPosition(targetPos, lookAt, 1000);

          console.log('[GraphCanvas3D] ✅ Camera movement initiated');
        } catch (error) {
          console.error('[GraphCanvas3D] ❌ Error during focus:', error);
        }
      }, 500);
    };

    window.addEventListener('focus-active-nodes', handleFocusActiveNodes as EventListener);

    return () => {
      window.removeEventListener('focus-active-nodes', handleFocusActiveNodes as EventListener);
    };
  }, [nodes, graphData.nodes]);

  return (
    <div
      id="graph-3d-container"
      className="absolute inset-0 w-full h-full"
      style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
    >
      {}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-sm text-muted-foreground">
              Rendering graph with {nodes.length} nodes...
            </div>
            {lodEnabled && (
              <div className="text-xs text-muted-foreground">Optimization mode enabled</div>
            )}
          </div>
        </div>
      )}

      {}
      <div className="controls-3d">
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-1">
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="h-8 w-8 hover:bg-accent hover:text-accent-foreground"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="h-8 w-8 hover:bg-accent hover:text-accent-foreground"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCenterGraph}
              className="h-8 w-8 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
              title="Center Graph"
            >
              <Focus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIs3DView(false)}
              disabled={isForced3D}
              className="h-8 w-8 hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              style={isForced3D ? { color: 'hsl(var(--foreground))' } : undefined}
              title={
                isForced3D ? '2D view disabled for large graphs (500+ nodes)' : 'Switch to 2D view'
              }
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeThreeObject={(node: GraphNode) => {
          const group = new THREE.Group();

          let distanceFromCamera = 0;
          if (lodEnabled && fgRef.current) {
            const camera = fgRef.current.camera();
            const nodePos = new THREE.Vector3(node.x || 0, node.y || 0, node.z || 0);
            distanceFromCamera = camera.position.distanceTo(nodePos);
          }

          const isDistant = lodEnabled && distanceFromCamera > LOD_DISTANCE_THRESHOLD;
          const useSimplified = lodEnabled && nodes.length > VERY_LARGE_GRAPH_THRESHOLD;

          const isGraphReference = node.type === 'graphReferenceNode';

          const dynamicSize = calculateNodeSize(node.name);

          let nodeGeometry: THREE.BufferGeometry;
          let nodeColor: number;

          if (isGraphReference) {
            nodeGeometry = new THREE.BoxGeometry(dynamicSize, dynamicSize, dynamicSize);

            nodeColor = node.active ? primaryColorHex : 0x71717a;
          } else {
            const segments = useSimplified ? 8 : 16;
            nodeGeometry = new THREE.SphereGeometry(dynamicSize, segments, segments);
            nodeColor = node.active ? primaryColorHex : 0x71717a;
          }

          const nodeMaterial = new THREE.MeshBasicMaterial({
            color: nodeColor,
            transparent: true,
            opacity: 0.8,
          });

          if (selectedNode === node.id && !isDistant) {
            nodeMaterial.color.setHex(primaryColorHex);
            nodeMaterial.opacity = 1.0;

            let borderGeometry: THREE.BufferGeometry;
            const borderSize = dynamicSize + 0.5;
            if (isGraphReference) {
              borderGeometry = new THREE.BoxGeometry(borderSize, borderSize, borderSize);
            } else {
              const segments = useSimplified ? 8 : 16;
              borderGeometry = new THREE.SphereGeometry(borderSize, segments, segments);
            }

            const borderMaterial = new THREE.MeshBasicMaterial({
              color: primaryColorHex,
              transparent: true,
              opacity: 0.3,
              wireframe: true,
            });
            const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
            group.add(borderMesh);
          }

          const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
          group.add(nodeMesh);

          if (!isDistant) {
            const sprite = new SpriteText(node.name);
            sprite.material.depthWrite = false;
            sprite.color = node.active ? primaryColor : foregroundColor;
            sprite.textHeight = 3;
            sprite.position.set(0, dynamicSize + 5, 0);

            if (selectedNode === node.id) {
              sprite.strokeWidth = 0.5;
              sprite.strokeColor = primaryColor;
            } else {
              sprite.strokeWidth = 0;
            }

            group.add(sprite);
          }

          return group;
        }}
        nodeColor={() => 'transparent'}
        nodeVal={0}
        nodeOpacity={0}
        linkColor={() => linkColor}
        linkWidth={0.5}
        linkDirectionalArrowLength={0}
        linkOpacity={0.8}
        linkThreeObjectExtend={true}
        onNodeClick={handleNodeClick}
        enableNodeDrag={false}
        enableNavigationControls={true}
        showNavInfo={false}
        backgroundColor={backgroundColor}
        controlType="orbit"
        rendererConfig={{
          antialias: nodes.length < LARGE_GRAPH_THRESHOLD,
          alpha: true,

          precision: nodes.length > VERY_LARGE_GRAPH_THRESHOLD ? 'lowp' : 'highp',

          powerPreference: 'high-performance',

          failIfMajorPerformanceCaveat: false,

          preserveDrawingBuffer: false,

          stencil: false,

          depth: true,
        }}
        warmupTicks={nodes.length > LARGE_GRAPH_THRESHOLD ? 50 : 100}
        cooldownTicks={nodes.length > VERY_LARGE_GRAPH_THRESHOLD ? 0 : Infinity}
        d3VelocityDecay={0.3}
      />
    </div>
  );
};

export default GraphCanvas3D;
