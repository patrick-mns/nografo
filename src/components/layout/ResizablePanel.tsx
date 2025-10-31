import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  style?: React.CSSProperties;
  onMinimizedChange?: (minimized: boolean) => void;
  isMinimized?: boolean;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  defaultHeight = 300,
  minHeight = 100,
  maxHeight = 800,
  className = '',
  style = {},
  onMinimizedChange,
  isMinimized: externalIsMinimized = false,
}) => {
  const [height, setHeight] = useState(defaultHeight);
  const [isResizing, setIsResizing] = useState(false);
  const [previousHeight, setPreviousHeight] = useState(defaultHeight);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalIsMinimized && height > 0) {
      setPreviousHeight(height);
      setHeight(40);
    } else if (!externalIsMinimized && height === 40) {
      setHeight(previousHeight || defaultHeight);
    }
  }, [externalIsMinimized, height, previousHeight, defaultHeight]);

  useEffect(() => {
    const checkHeight = () => {
      if (!panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (rect.bottom > viewportHeight) {
        const newHeight = viewportHeight - rect.top - 10;
        if (newHeight >= minHeight && newHeight < height) {
          setHeight(newHeight);
        }
      }
    };

    checkHeight();
    window.addEventListener('resize', checkHeight);

    return () => {
      window.removeEventListener('resize', checkHeight);
    };
  }, [height, minHeight]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const containerBottom = window.innerHeight;
      const newHeight = containerBottom - e.clientY;

      if (newHeight < 50) {
        setPreviousHeight(height);
        setHeight(40);
        if (onMinimizedChange) onMinimizedChange(true);
        return;
      }

      if (height === 40 && newHeight > 60) {
        if (onMinimizedChange) onMinimizedChange(false);
        setHeight(Math.max(minHeight, previousHeight));
        return;
      }

      const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      const maxAllowedHeight = containerBottom - 100;
      const finalHeight = Math.min(clampedHeight, maxAllowedHeight);

      setHeight(finalHeight);
      setPreviousHeight(finalHeight);
    },
    [isResizing, minHeight, maxHeight, height, previousHeight, onMinimizedChange]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'ns-resize';
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
      className={`relative border-t border-border bg-background flex flex-col transition-all duration-200 ${className}`}
      style={{
        height: `${height}px`,
        maxHeight: '50vh',
        ...style,
      }}
    >
      {}
      <div
        onMouseDown={startResizing}
        className={`
          absolute -top-1 left-0 right-0 cursor-ns-resize
          hover:bg-primary/30 transition-all z-50
          ${isResizing ? 'bg-primary/50 h-1' : height === 40 ? 'bg-border/30 h-1' : 'bg-transparent h-1'}
        `}
      >
        {}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 rounded-full transition-all ${
            isResizing
              ? 'bg-primary w-16 h-1'
              : height === 40
                ? 'bg-border w-12 h-1'
                : 'bg-border/50 w-10 h-0.5'
          }`}
        />
      </div>

      {}
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  );
};
