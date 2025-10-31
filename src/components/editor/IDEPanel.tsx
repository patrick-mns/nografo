import React, { useState } from 'react';
import { Terminal } from '../terminal/Terminal';
import { FileBrowser } from './FileBrowser';
import { Button } from '../ui/button';
import { FolderOpen, Terminal as TerminalIcon, Code, ChevronDown, ChevronUp } from 'lucide-react';
import { useGit } from '../../hooks/useGit';

interface IDEPanelProps {
  className?: string;
}

export const IDEPanel: React.FC<IDEPanelProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'files' | 'terminal'>('terminal');

  const git = useGit();

  const handleInitWorkspace = async () => {
    try {
      const result = await (window as any).electronAPI?.workspace?.select();

      if (result?.success && result.path) {
        await git.initRepo(result.path);
      }
    } catch (error) {
      console.error('Failed to initialize workspace:', error);
    }
  };

  const handleFileSelect = async (filepath: string) => {
    try {
      await git.readFile(filepath);
    } catch (error) {
      console.error('Failed to read file:', error);
    }
  };

  const handleCreateFile = async (filepath: string, content: string) => {
    try {
      await git.createFile(filepath, content);
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleCommit = async (message: string) => {
    try {
      await git.commit(message);
    } catch (error) {
      console.error('Failed to commit:', error);
    }
  };

  return (
    <div
      className={`flex flex-col bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden ${className}`}
    >
      {}
      <div className="flex items-center justify-between bg-[#252526] border-b border-gray-800">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('files')}
            className={`h-10 px-4 rounded-none border-b-2 ${
              activeTab === 'files'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Files
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('terminal')}
            className={`h-10 px-4 rounded-none border-b-2 ${
              activeTab === 'terminal'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <TerminalIcon className="w-4 h-4 mr-2" />
            Terminal
            {git.logs.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                {git.logs.length}
              </span>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2 px-3">
          {!git.workspacePath && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleInitWorkspace}
              className="h-7 text-xs"
            >
              <Code className="w-3 h-3 mr-1" />
              Open Workspace
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {}
      {isExpanded && (
        <div className="flex-1 overflow-hidden">
          {activeTab === 'files' ? (
            <FileBrowser
              workspacePath={git.workspacePath}
              onFileSelect={handleFileSelect}
              onCreateFile={handleCreateFile}
              onCommit={handleCommit}
              className="h-full"
            />
          ) : (
            <Terminal logs={git.logs} onClear={git.clearLogs} className="h-full" />
          )}
        </div>
      )}

      {}
      {!isExpanded && (
        <div className="px-3 py-2 bg-[#252526] border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            {git.workspacePath ? (
              <>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Ready
                </span>
                <span className="text-gray-600">|</span>
                <span>{git.workspacePath.split('/').pop()}</span>
              </>
            ) : (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                No workspace
              </span>
            )}
          </div>

          {git.logs.length > 0 && (
            <span className="text-primary">{git.logs[git.logs.length - 1].message}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default IDEPanel;
