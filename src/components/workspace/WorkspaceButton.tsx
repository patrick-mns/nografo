import { useWorkspace } from '@/hooks/useWorkspace';
import { Button } from '@/components/ui/button';
import { Folder, FolderOpen } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function WorkspaceButton() {
  const { workspace, graphs, selectWorkspace, closeWorkspace, isElectronEnv } = useWorkspace();

  if (!isElectronEnv) {
    return null;
  }

  if (!workspace) {
    return (
      <Button onClick={selectWorkspace} variant="outline" size="sm" className="gap-2">
        <FolderOpen className="h-4 w-4" />
        <span className="hidden md:inline">Select Folder</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Folder className="h-4 w-4 text-primary" />
          <div className="hidden md:flex flex-col items-start">
            <span className="text-xs font-medium leading-none">{workspace.name}</span>
            <span className="text-xs text-muted-foreground leading-none mt-0.5">
              {graphs.length} {graphs.length === 1 ? 'graph' : 'graphs'}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{workspace.name}</p>
          <p className="text-xs text-muted-foreground truncate" title={workspace.path}>
            {workspace.path}
          </p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={selectWorkspace}>
          <FolderOpen className="mr-2 h-4 w-4" />
          Change Folder
        </DropdownMenuItem>

        <DropdownMenuItem onClick={closeWorkspace} className="text-destructive">
          Close Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
