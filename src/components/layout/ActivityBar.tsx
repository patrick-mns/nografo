import React from 'react';
import { MessageSquare, LayoutGrid, Eye } from 'lucide-react';
import { Button } from '../ui/button';

interface ActivityBarProps {
  isChatPanelOpen: boolean;
  isSidePanelOpen: boolean;
  isPreviewPanelOpen: boolean;
  onToggleChat: () => void;
  onToggleSidePanel: () => void;
  onTogglePreview: () => void;
  className?: string;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  isChatPanelOpen,
  isSidePanelOpen,
  isPreviewPanelOpen,
  onToggleChat,
  onToggleSidePanel,
  onTogglePreview,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col w-10 bg-card border-r border-border items-center py-2 gap-1 shrink-0 ${className}`}
    >
      {}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleChat}
        className="w-7 h-7 p-1"
        title="AI Chat"
      >
        <MessageSquare
          className={`w-4 h-4 transition-colors ${isChatPanelOpen ? 'text-primary' : 'text-muted-foreground'}`}
        />
      </Button>

      {}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidePanel}
        className="w-7 h-7 p-1"
        title="Contexts and Graphs"
      >
        <LayoutGrid
          className={`w-4 h-4 transition-colors ${isSidePanelOpen ? 'text-primary' : 'text-muted-foreground'}`}
        />
      </Button>

      {}
      <Button
        variant="ghost"
        size="icon"
        onClick={onTogglePreview}
        className="w-7 h-7 p-1"
        title="Markdown Preview"
      >
        <Eye
          className={`w-4 h-4 transition-colors ${isPreviewPanelOpen ? 'text-primary' : 'text-muted-foreground'}`}
        />
      </Button>

      {}
      <div className="flex-1" />
    </div>
  );
};

export default ActivityBar;
