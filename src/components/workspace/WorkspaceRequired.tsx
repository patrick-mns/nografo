import { FolderOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export function WorkspaceRequired() {
  const { selectWorkspace } = useWorkspace();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-sm text-muted-foreground mb-4">No workspace selected</p>
      <Button onClick={selectWorkspace} size="sm" variant="outline">
        Select Workspace
      </Button>
    </div>
  );
}
