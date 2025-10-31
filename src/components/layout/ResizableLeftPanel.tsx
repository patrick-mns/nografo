import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ResizableLeftPanelProps {
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  onWidthChange?: (width: number) => void;
  onMinimize?: () => void;
}

export const ResizableLeftPanel: React.FC<ResizableLeftPanelProps> = ({
  children,
  minWidth = 250,
  maxWidth = 600,
  defaultWidth = 350,
  onWidthChange,
  onMinimize,
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const MINIMIZE_THRESHOLD = 100;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;

      if (newWidth < MINIMIZE_THRESHOLD) {
        setWidth(0);
      } else {
        const constrainedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
        setWidth(constrainedWidth);
        
        if (onWidthChange) {
          onWidthChange(constrainedWidth);
        }
      }
    },
    [isResizing, minWidth, maxWidth, onWidthChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);

    if (width < MINIMIZE_THRESHOLD && onMinimize) {
      onMinimize();
    }
  }, [width, onMinimize]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={panelRef}
      className="relative border-r border-border bg-background shrink-0 overflow-hidden"
      style={{ width: `${width}px` }}
    >
      {}
      {width > 100 && <div className="w-full h-full">{children}</div>}

      {}
      <div
        className={`absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-primary/30 transition-colors ${
          isResizing ? 'bg-primary/50' : 'bg-transparent'
        }`}
        onMouseDown={handleMouseDown}
        style={{ zIndex: 10 }}
      >
        {}
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-1 h-12 bg-primary/70 rounded-l-sm opacity-0 hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};

export default ResizableLeftPanel;
