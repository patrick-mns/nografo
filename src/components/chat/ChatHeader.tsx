import React from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';

interface ChatHeaderProps {
  chatName: string;
  messageCount: number;
  onClear: () => void;
  canClear: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatName,
  messageCount,
  onClear,
  canClear,
}) => {
  return (
    <div className="flex items-center justify-between h-12 px-4 border-b border-border shrink-0 bg-card">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{chatName}</h3>
          <p className="text-xs text-muted-foreground">{messageCount} messages</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          onClick={onClear}
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-muted-foreground hover:text-destructive"
          title="Clear conversation"
          disabled={!canClear}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Clear</span>
        </Button>
      </div>
    </div>
  );
};
