import React from 'react';
import {
  Edit,
  MoreVertical,
  Trash2,
  Sparkles,
  FileText,
  MessageSquare,
  Wand2,
  Paperclip,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { isElectron } from '@/lib/electron';

interface ContextNodeMenuProps {
  isConfigured: boolean;
  isEnhancing: boolean;
  hasContent: boolean;
  onEdit: (e: React.MouseEvent) => void;
  onAttachFiles: (e: React.MouseEvent) => void;
  onEnhance: (task: 'improve' | 'expand' | 'summarize' | 'clarify', e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const ContextNodeMenu: React.FC<ContextNodeMenuProps> = ({
  isConfigured,
  isEnhancing,
  hasContent,
  onEdit,
  onAttachFiles,
  onEnhance,
  onDelete,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => e.stopPropagation()}
          className="h-6 w-6 p-0 bg-background/90 hover:bg-background border shadow-sm backdrop-blur-sm"
          title="Ações do nó"
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit Node</span>
        </DropdownMenuItem>

        {isElectron() && (
          <DropdownMenuItem onClick={onAttachFiles}>
            <Paperclip className="mr-2 h-4 w-4" />
            <span>Attach Files</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {}
        {isConfigured && (
          <>
            <DropdownMenuItem
              onClick={(e) => onEnhance('improve', e)}
              disabled={isEnhancing || !hasContent}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              <span>Improve</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => onEnhance('expand', e)}
              disabled={isEnhancing || !hasContent}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Expand</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => onEnhance('summarize', e)}
              disabled={isEnhancing || !hasContent}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Summarize</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => onEnhance('clarify', e)}
              disabled={isEnhancing || !hasContent}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              <span>Clarify</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Node</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
