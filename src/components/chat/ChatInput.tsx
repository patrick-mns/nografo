import React, { useRef } from 'react';
import { ArrowRight, Square } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { FileAttachment, type AttachedFile } from './FileAttachment';
import { FileAutoComplete } from './FileAutoComplete';
import type { SlashCommand } from '@/hooks/useSlashCommands';
import type { ChatMode } from '@/store/developerSettingsStore';
import { isElectron, type WorkspaceInfo } from '@/lib/electron';

interface ChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;

  attachedFiles: AttachedFile[];
  onRemoveFile: (path: string) => void;
  showFileAutoComplete: boolean;
  fileQuery: string;
  onFileSelect: (path: string) => void;
  onCloseFileAutoComplete: () => void;
  workspace: WorkspaceInfo | null;

  showCommandMenu: boolean;
  filteredCommands: SlashCommand[];
  selectedCommandIndex: number;
  onSelectCommand: (command: string) => void;

  isStreaming: boolean;
  onStopStreaming: () => void;

  isLoading: boolean;
  chatMode: ChatMode;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputValue,
  onInputChange,
  onSend,
  onKeyDown,
  attachedFiles,
  onRemoveFile,
  showFileAutoComplete,
  fileQuery,
  onFileSelect,
  onCloseFileAutoComplete,
  workspace,
  showCommandMenu,
  filteredCommands,
  selectedCommandIndex,
  onSelectCommand,
  isStreaming,
  onStopStreaming,
  isLoading,
  chatMode,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="border-t border-border p-4 shrink-0 bg-card relative">
      {}
      {attachedFiles.length > 0 && (
        <div className="mb-3">
          <FileAttachment files={attachedFiles} onRemove={onRemoveFile} />
        </div>
      )}

      {}
      {showFileAutoComplete && (
        <div className="relative mb-2">
          <FileAutoComplete
            query={fileQuery}
            onSelect={onFileSelect}
            onClose={onCloseFileAutoComplete}
            workspace={workspace}
          />
        </div>
      )}

      {}
      {showCommandMenu && filteredCommands.length > 0 && (
        <div className="command-menu absolute bottom-full left-4 right-4 mb-2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50 max-h-48">
          <div className="overflow-y-auto max-h-40">
            {filteredCommands.map((cmd, index) => (
              <button
                key={cmd.command}
                onClick={() => onSelectCommand(cmd.command)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  index === selectedCommandIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
              >
                <div className="text-primary shrink-0">{cmd.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{cmd.command}</div>
                  <div className="text-xs text-muted-foreground truncate">{cmd.description}</div>
                </div>
                {cmd.usage && (
                  <div className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                    {cmd.usage}
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 border-t border-border">
            <kbd className="px-1.5 py-0.5 bg-background rounded text-xs">↑↓</kbd> navigate ·
            <kbd className="px-1.5 py-0.5 bg-background rounded text-xs ml-2">Tab</kbd> or
            <kbd className="px-1.5 py-0.5 bg-background rounded text-xs ml-1">Enter</kbd> select ·
            <kbd className="px-1.5 py-0.5 bg-background rounded text-xs ml-2">Esc</kbd> close
          </div>
        </div>
      )}

      {}
      <div className="relative border border-border rounded-lg bg-background overflow-hidden">
        <Textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            const newValue = e.target.value;

            if (chatMode === 'command') {
              if (newValue === '' || newValue.startsWith('/')) {
                onInputChange(newValue);
              }
            } else {
              onInputChange(newValue);
            }
          }}
          onKeyDown={onKeyDown}
          placeholder={
            chatMode === 'command' ? 'Type / for commands' : 'Type your message or / for commands'
          }
          className="flex-1 min-h-[80px] max-h-[300px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={isLoading}
          rows={3}
        />
        {}
        <div className="flex items-center px-2 py-2 border-t border-border bg-muted/30">
          {}
          <div className="flex-1" />

          {}
          {isStreaming ? (
            <Button
              onClick={onStopStreaming}
              size="icon"
              variant="destructive"
              className="shrink-0 w-7 h-7"
              title="Stop streaming"
            >
              <Square className="w-4 h-4 fill-current" />
            </Button>
          ) : (
            <Button
              onClick={onSend}
              disabled={
                !inputValue.trim() ||
                isLoading ||
                (chatMode === 'command' && !inputValue.startsWith('/'))
              }
              size="icon"
              className="shrink-0 w-7 h-7"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        <kbd className="px-1 py-0.5 bg-muted rounded text-xs">/</kbd> commands ·
        {isElectron() && (
          <>
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">#</kbd> attach files ·
          </>
        )}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs ml-1">Enter</kbd> send
      </p>
    </div>
  );
};
