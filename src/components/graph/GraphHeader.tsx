import React, { useState, useRef, useEffect } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { Network } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { toast } from '../../hooks/useToast';

const GraphHeader: React.FC = () => {
  const { currentGraph, updateGraph, exportGraph } = useGraphStore();
  const { saveGraph: saveToWorkspace, isElectronEnv } = useWorkspace();
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const graphName = currentGraph?.name || 'New';

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (!currentGraph) return;
    setEditingName(graphName);
    setIsEditing(true);
  };

  const handleFinishEditing = async () => {
    if (!currentGraph || !editingName.trim()) {
      setIsEditing(false);
      return;
    }

    if (editingName.trim() !== graphName) {
      try {
        useGraphStore.setState((state) => ({
          currentGraph: state.currentGraph
            ? {
                ...state.currentGraph,
                name: editingName.trim(),
              }
            : null,
        }));

        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          currentGraph.id
        );

        if (isValidUUID) {
          await updateGraph(currentGraph.id, editingName.trim());
        }

        if (isElectronEnv && saveToWorkspace) {
          const graphData = exportGraph();

          const dataWithName = {
            ...graphData,
            name: editingName.trim(),
            id: currentGraph.id,
          };
          await saveToWorkspace(currentGraph.id, dataWithName);
        }

        toast({
          title: 'Graph renamed',
          description: `Renamed to "${editingName.trim()}"`,
        });
      } catch (error) {
        console.error('Failed to update graph name:', error);
        toast({
          title: 'Rename failed',
          description: error instanceof Error ? error.message : 'Failed to rename graph',
          variant: 'destructive',
        });
      }
    }

    setIsEditing(false);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFinishEditing();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingName('');
    }
  };

  if (!currentGraph) {
    return null;
  }

  return (
    <div
      className="absolute top-3 left-1/2 transform -translate-x-1/2 z-50 bg-background/70 backdrop-blur-sm border border-border/50 shadow-md px-2 py-1 flex items-center justify-center gap-1.5 rounded-md"
      style={{ pointerEvents: 'auto' }}
    >
      <Network className="w-2.5 h-2.5 text-primary" />

      {}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          onBlur={handleFinishEditing}
          onKeyDown={handleKeyDown}
          className="truncate max-w-xs text-[10px] font-medium bg-transparent border-none outline-none focus:outline-none px-1"
          style={{ width: `${Math.max(editingName.length * 6, 60)}px` }}
        />
      ) : (
        <span
          className="truncate max-w-xs text-[10px] font-medium cursor-pointer hover:text-primary transition-colors"
          onDoubleClick={handleDoubleClick}
          title="Double click to rename"
        >
          {graphName}
        </span>
      )}
    </div>
  );
};

export default GraphHeader;
