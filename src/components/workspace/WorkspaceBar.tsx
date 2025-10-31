import { Button } from '../ui/button';
import { Folder, ChevronDown, FolderOpen, Settings, Check, Loader2 } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useGraphStore } from '@/store/graphStore';
import { useState, useEffect, useRef } from 'react';
import { SettingsView } from '../settings/SettingsView';
import { isElectron } from '@/lib/electron';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function WorkspaceBar() {
  const { workspace, selectWorkspace, closeWorkspace, saveGraph } = useWorkspace();
  const { nodes, edges, currentGraph } = useGraphStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSavedStateRef = useRef<string>('');
  const currentGraphIdRef = useRef<string | null>(null);

  useEffect(() => {
    const graphId = currentGraph?.id || null;

    if (graphId !== currentGraphIdRef.current) {
      currentGraphIdRef.current = graphId;
      lastSavedStateRef.current = '';
      setSaveStatus('saved');

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    }
  }, [currentGraph?.id]);

  useEffect(() => {
    if (!workspace || (nodes.length === 0 && edges.length === 0)) {
      setSaveStatus('saved');
      return;
    }

    const currentState = JSON.stringify({ nodes, edges });

    if (lastSavedStateRef.current === '') {
      lastSavedStateRef.current = currentState;
      setSaveStatus('saved');
      return;
    }

    if (currentState !== lastSavedStateRef.current) {
      setSaveStatus('unsaved');

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        setSaveStatus('saving');

        const graphId = currentGraph?.id || 'default';
        const graphName = currentGraph?.name || 'Untitled Graph';

        const graphData = {
          nodes,
          edges,
          name: graphName,
          createdAt: new Date().toISOString(),
        };

        try {
          const success = await saveGraph(graphId, graphData);

          if (success) {
            lastSavedStateRef.current = currentState;
            setSaveStatus('saved');

            setTimeout(() => {
              setSaveStatus('saved');
            }, 2000);
          } else {
            setSaveStatus('unsaved');
          }
        } catch (error) {
          console.error('❌ Error saving graph:', error);
          setSaveStatus('unsaved');
        }
      }, 1000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [nodes, edges, workspace, currentGraph, saveGraph]);

  const handleCloseWorkspace = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    lastSavedStateRef.current = '';
    currentGraphIdRef.current = null;
    setSaveStatus('saved');

    await closeWorkspace();
  };

  if (!workspace) {
    return (
      <>
        <div className="h-[38px] border-b border-border/40 bg-background/95 backdrop-blur-sm flex items-center justify-between pl-24 pr-2">
          <div className="flex-1" />
          <Button
            onClick={selectWorkspace}
            variant="ghost"
            size="sm"
            className="h-7 gap-2 text-sm font-medium"
          >
            <FolderOpen className="h-4 w-4" />
            Select Workspace
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        {isSettingsOpen && <SettingsView onClose={() => setIsSettingsOpen(false)} />}
      </>
    );
  }

  const workspaceName = workspace.path.split('/').pop() || workspace.name;
  const isElectronEnv = isElectron();

  return (
    <>
      <div
        className="h-[38px] border-b border-border/40 bg-background/95 backdrop-blur-sm flex items-center justify-between pl-24 pr-2"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex-1" />

        {isElectronEnv ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-2 text-sm font-medium hover:bg-accent"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              >
                <Folder className="h-4 w-4 text-muted-foreground" />
                {workspaceName}
                {workspace && (nodes.length > 0 || edges.length > 0) && (
                  <>
                    {saveStatus === 'saving' && (
                      <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
                    )}
                    {saveStatus === 'saved' && <Check className="h-3 w-3 text-green-500" />}
                    {saveStatus === 'unsaved' && (
                      <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                    )}
                  </>
                )}
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              <DropdownMenuItem onClick={selectWorkspace} className="cursor-pointer">
                <FolderOpen className="mr-2 h-4 w-4" />
                <span>Change Workspace</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleCloseWorkspace}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Folder className="mr-2 h-4 w-4" />
                <span>Close Workspace</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2 h-7 px-3 text-sm font-medium">
            <Folder className="h-4 w-4 text-muted-foreground" />
            {workspaceName}
            {workspace && (nodes.length > 0 || edges.length > 0) && (
              <>
                {saveStatus === 'saving' && (
                  <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
                )}
                {saveStatus === 'saved' && <Check className="h-3 w-3 text-green-500" />}
                {saveStatus === 'unsaved' && <div className="h-2 w-2 bg-yellow-500 rounded-full" />}
              </>
            )}
          </div>
        )}

        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setIsSettingsOpen(true)}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      {isSettingsOpen && <SettingsView onClose={() => setIsSettingsOpen(false)} />}
    </>
  );
}
