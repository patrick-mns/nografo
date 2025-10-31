import React, { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon, X, Minimize2, Maximize2, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';

interface TerminalLog {
  message: string;
  type: 'info' | 'success' | 'error' | 'warn' | 'command';
  timestamp: string;
}

interface TerminalProps {
  logs: TerminalLog[];
  onClear?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onClose?: () => void;
  className?: string;
}

export const Terminal: React.FC<TerminalProps> = ({
  logs,
  onClear,
  isMinimized = false,
  onToggleMinimize,
  onClose,
  className = '',
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    if (!terminalRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;

    setAutoScroll(isAtBottom);
  };

  const getLogColor = (type: TerminalLog['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-400';
      case 'command':
        return 'text-primary';
      default:
        return 'text-gray-300';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      className={`flex flex-col bg-[#1e1e1e] border border-gray-800 rounded-lg overflow-hidden ${className}`}
    >
      {}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-gray-800">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Terminal</span>
          {logs.length > 0 && <span className="text-xs text-gray-500">({logs.length} logs)</span>}
        </div>

        <div className="flex items-center gap-1">
          {onClear && logs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-7 w-7 p-0 hover:bg-gray-700"
              title="Clear terminal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}

          {onToggleMinimize && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMinimize}
              className="h-7 w-7 p-0 hover:bg-gray-700"
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? (
                <Maximize2 className="w-3.5 h-3.5" />
              ) : (
                <Minimize2 className="w-3.5 h-3.5" />
              )}
            </Button>
          )}

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 hover:bg-gray-700"
              title="Close terminal"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {}
      {!isMinimized && (
        <div
          ref={terminalRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-3 font-mono text-sm"
          style={{
            minHeight: '200px',
            maxHeight: '400px',
          }}
        >
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              <div className="text-center">
                <TerminalIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Terminal output will appear here</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <span className="text-gray-600 text-xs flex-shrink-0 mt-0.5">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span className={`flex-1 ${getLogColor(log.type)} break-words`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {}
          {!autoScroll && (
            <div
              className="fixed bottom-4 right-4 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full shadow-lg cursor-pointer hover:bg-primary/90"
              onClick={() => {
                if (terminalRef.current) {
                  terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
                  setAutoScroll(true);
                }
              }}
            >
              ↓ New output
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Terminal;
