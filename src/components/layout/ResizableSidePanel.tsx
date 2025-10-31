import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ResizableSidePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  style?: React.CSSProperties;
  onWidthChange?: (width: number) => void;
  onMinimize?: () => void;
}

export const ResizableSidePanel: React.FC<ResizableSidePanelProps> = ({
  children,
  defaultWidth = 280,
  minWidth = 200,
  maxWidth = 600,
  className = '',
  style = {},
  onWidthChange,
  onMinimize,
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const MINIMIZE_THRESHOLD = 100;

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);

    if (width < MINIMIZE_THRESHOLD && onMinimize) {
      onMinimize();
    }
  }, [width, onMinimize]);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const containerRight = window.innerWidth;
      const newWidth = containerRight - e.clientX;

      if (newWidth < MINIMIZE_THRESHOLD) {
        setWidth(0);
      } else {
        const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

        const maxAllowedWidth = containerRight - 200;
        const finalWidth = Math.min(clampedWidth, maxAllowedWidth);

        setWidth(finalWidth);
      }

      if (onWidthChange) {
        onWidthChange(newWidth < MINIMIZE_THRESHOLD ? 0 : newWidth);
      }
    },
    [isResizing, minWidth, maxWidth, onWidthChange]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <div
      ref={panelRef}
      className={`relative border-l border-border bg-background flex flex-col transition-all duration-200 ${className}`}
      style={{
        width: `${width}px`,
        maxWidth: '50vw',
        ...style,
      }}
    >
      {}
      <div
        onMouseDown={startResizing}
        className={`
          absolute -left-1 top-0 bottom-0 cursor-ew-resize
          hover:bg-primary/30 transition-all z-50
          ${isResizing ? 'bg-primary/50 w-1' : 'bg-transparent w-1'}
        `}
      >
        {}
        <div
          className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-full transition-all ${
            isResizing ? 'bg-primary w-1 h-16' : 'bg-border/50 w-0.5 h-10'
          }`}
        />
      </div>

      {}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
};
