import { useWorkspace } from '@/hooks/useWorkspace';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FolderOpen, Folder, FileJson, AlertCircle } from 'lucide-react';

export function WorkspaceSelector() {
  const { workspace, graphs, loading, error, isElectronEnv, selectWorkspace, closeWorkspace } =
    useWorkspace();

  if (!isElectronEnv) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <div className="animate-pulse">Loading workspace...</div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <Card className="p-6 m-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-4 rounded-full bg-muted">
            <Folder className="w-12 h-12 text-muted-foreground" />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">No workspace selected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select a folder to save your graphs locally
            </p>
          </div>

          <Button onClick={selectWorkspace} size="lg" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            Select Working Folder
          </Button>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 m-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded bg-primary/10 text-primary">
            <Folder className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold truncate">{workspace.name}</h4>
              <span className="text-xs text-muted-foreground shrink-0">
                {graphs.length} {graphs.length === 1 ? 'graph' : 'graphs'}
              </span>
            </div>

            <p className="text-xs text-muted-foreground truncate" title={workspace.path}>
              {workspace.path}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={selectWorkspace} className="gap-2">
            <FolderOpen className="w-4 h-4" />
            Change
          </Button>

          <Button variant="ghost" size="sm" onClick={closeWorkspace}>
            Close
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </Card>
  );
}

export function WorkspaceIndicator() {
  const { workspace, graphs, selectWorkspace, isElectronEnv } = useWorkspace();

  if (!isElectronEnv) return null;

  if (!workspace) {
    return (
      <button
        onClick={selectWorkspace}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors w-full"
      >
        <FolderOpen className="w-4 h-4" />
        <span>Select folder...</span>
      </button>
    );
  }

  return (
    <button
      onClick={selectWorkspace}
      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors w-full"
      title={workspace.path}
    >
      <Folder className="w-4 h-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0 text-left">
        <div className="font-medium truncate">{workspace.name}</div>
        <div className="text-xs text-muted-foreground">
          {graphs.length} {graphs.length === 1 ? 'graph' : 'graphs'}
        </div>
      </div>
      <FileJson className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}
