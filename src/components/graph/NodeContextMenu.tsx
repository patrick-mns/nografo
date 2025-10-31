import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Edit, Trash2, Wand2, Sparkles, MessageSquare, FileText, MoreVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';

interface NodeContextMenuProps {
  label: string;
  content: string;
  isActive: boolean;
  position: { x: number; y: number };
  onUpdateLabel: (label: string) => void;
  onUpdateContent: (content: string) => void;
  onToggleActive: (active: boolean) => void;
  onDelete: () => void;
  onEnhance?: (task: 'improve' | 'expand' | 'summarize' | 'clarify') => void;
  isEnhancing?: boolean;
}

export function NodeContextMenu({
  label,
  content,
  isActive,
  position,
  onUpdateLabel,
  onUpdateContent,
  onToggleActive,
  onDelete,
  onEnhance,
  isEnhancing = false,
}: NodeContextMenuProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [localLabel, setLocalLabel] = useState(label);
  const [localContent, setLocalContent] = useState(content);

  const handleSave = () => {
    onUpdateLabel(localLabel);
    onUpdateContent(localContent);
    setIsEditOpen(false);
  };

  const handleCancel = () => {
    setLocalLabel(label);
    setLocalContent(content);
    setIsEditOpen(false);
  };

  return (
    <>
      {}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full absolute"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {}
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit Node</span>
          </DropdownMenuItem>

          {}
          <DropdownMenuItem onClick={() => onToggleActive(!isActive)}>
            <Switch checked={isActive} className="mr-2 h-4 w-4" />
            <span>{isActive ? 'Deactivate' : 'Activate'}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {}
          {onEnhance && (
            <>
              <DropdownMenuItem
                onClick={() => onEnhance('improve')}
                disabled={isEnhancing || !content.trim()}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Improve</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onEnhance('expand')}
                disabled={isEnhancing || !content.trim()}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>Expand</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onEnhance('summarize')}
                disabled={isEnhancing || !content.trim()}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Summarize</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onEnhance('clarify')}
                disabled={isEnhancing || !content.trim()}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                <span>Clarify</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
            </>
          )}

          {}
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete Node</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Node</DialogTitle>
            <DialogDescription>Update the label and content of this node</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {}
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={localLabel}
                onChange={(e) => setLocalLabel(e.target.value)}
                placeholder="Node label..."
              />
            </div>

            {}
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
                placeholder="Node content..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            {}
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active in context</Label>
              <Switch id="active" checked={isActive} onCheckedChange={onToggleActive} />
            </div>
          </div>

          {}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
