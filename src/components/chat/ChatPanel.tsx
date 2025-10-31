import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { useGraphStore } from '@/store/graphStore';
import { useSecretsStore } from '@/store/secretsStore';
import { useChatsStore } from '@/store/chatsStore';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { aiService } from '@/services/aiService';
import { parseAIResponse } from '@/services/ai';
import { isElectron } from '@/lib/electron';
import type { ChatMode } from '@/store/developerSettingsStore';

import {
  useChatMessages,
  useFileAttachments,
  useSlashCommands,
  useActiveContext,
  useMessageHandlers,
  useContextExport,
} from '@/hooks';

import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  className?: string;
  chatMode: ChatMode;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ className = '', chatMode }) => {
  const { currentGraph } = useGraphStore();
  const { config, isConfigured } = useSecretsStore();
  const { getCurrentChat, clearCurrentChat, createChat, currentChatId } = useChatsStore();
  const { workspace } = useWorkspace();

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showFileAutoComplete, setShowFileAutoComplete] = useState(false);
  const [fileQuery, setFileQuery] = useState('');

  const { messages, addMessage, updateMessage, addAssistantMessage } = useChatMessages();
  const { attachedFiles, attachFile, removeFile, clearFiles } = useFileAttachments();
  const {
    showCommandMenu,
    filteredCommands,
    selectedCommandIndex,
    selectCommand,
    handleKeyNavigation,
  } = useSlashCommands(inputValue);
  const { collectActiveContextRecursive, activateRelevantNodes, processGraphReferences } =
    useActiveContext();
  const {
    generateContextualPrompt,
    handleActiveCommand,
    handleAddCommand,
    handleCreateCommand,
    createCodeActions,
  } = useMessageHandlers(config, updateMessage, addAssistantMessage);
  const { exportActiveContext } = useContextExport();

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!currentChatId && workspace) {
      createChat('Chat Inicial');
    }
  }, [currentChatId, createChat, workspace]);

  useEffect(() => {
    if (showCommandMenu) {
      setShowFileAutoComplete(false);
      return;
    }

    if (!isElectron()) {
      setShowFileAutoComplete(false);
      return;
    }

    const lastHashIndex = inputValue.lastIndexOf('#');
    console.log('[ChatPanel] Checking for # in input:', { lastHashIndex, inputValue });

    if (lastHashIndex !== -1) {
      const afterHash = inputValue.substring(lastHashIndex + 1);
      console.log('[ChatPanel] Text after #:', afterHash);

      if (!afterHash.includes(' ') && !afterHash.includes('\n')) {
        setFileQuery(afterHash);
        setShowFileAutoComplete(true);
        console.log('[ChatPanel] Showing file autocomplete with query:', afterHash);
        return;
      }
    }

    setShowFileAutoComplete(false);
  }, [inputValue, showCommandMenu]);

  const handleFileSelect = async (filePath: string) => {
    const lastHashIndex = inputValue.lastIndexOf('#');
    if (lastHashIndex !== -1) {
      const beforeHash = inputValue.substring(0, lastHashIndex);
      setInputValue(beforeHash + `#${filePath} `);
    }

    await attachFile(filePath);
    setShowFileAutoComplete(false);
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  const handleSlashCommand = async (command: string, loadingMsgId?: string) => {
    const [cmd, ...args] = command.slice(1).split(' ');
    const argument = args.join(' ');

    switch (cmd.toLowerCase()) {
      case 'active':
        await handleActiveCommand(argument, loadingMsgId);
        break;
      case 'add':
        await handleAddCommand(argument, loadingMsgId);
        break;
      case 'create':
        await handleCreateCommand(argument, loadingMsgId);
        break;
      case 'clear': {
        const { clearGraph } = useGraphStore.getState();
        clearGraph();
        if (loadingMsgId) {
          updateMessage(loadingMsgId, { content: 'Graph cleared.' });
        } else {
          addAssistantMessage('Graph cleared.');
        }
        break;
      }
      case 'help': {
        const helpMessage = `## 📋 Available Commands

### Create & Modify
- **\`/create <description>\`** - Create a new graph from scratch
- **\`/add <description>\`** - Add nodes to the existing graph

### Manage Context
- **\`/active <description>\`** - Mark specific nodes as active based on description

### Utilities
- **\`/clear\`** - Clear all nodes from the graph
- **\`/help\`** - Show this help message

---

💡 **Tip:** Use natural language descriptions for better results!`;
        if (loadingMsgId) {
          updateMessage(loadingMsgId, { content: helpMessage });
        } else {
          addAssistantMessage(helpMessage);
        }
        break;
      }
      default: {
        const unknownMessage = `Unknown command: /${cmd}. Type /help for available commands.`;
        if (loadingMsgId) {
          updateMessage(loadingMsgId, { content: unknownMessage });
        } else {
          addAssistantMessage(unknownMessage);
        }
      }
    }
  };

  const handleRegularCommand = async (command: string) => {
    const context = generateContextualPrompt();
    console.log('[ChatPanel] Generated context for active command:', context);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    setIsLoading(true);
    setIsStreaming(true);

    const CONTEXT_WINDOW_SIZE = 20;
    const allHistory = messages
      .slice(0, -1)
      .filter((msg) => msg.type === 'user' || msg.type === 'assistant');
    const conversationHistory = allHistory.slice(-CONTEXT_WINDOW_SIZE).map((msg) => ({
      type: msg.type,
      content: msg.content,
      timestamp: msg.timestamp,
    }));

    addMessage({ type: 'assistant', content: '🔍 **Analyzing relevant context...**' });
    const currentMessages = useChatsStore.getState().getCurrentChat()?.messages || [];
    const activationMsg = currentMessages[currentMessages.length - 1];

    const { relevantNodeIds, activatedNodesInfo, referenceNodesToOpen } =
      await activateRelevantNodes(command, context, config, aiService);

    const nodeCount = relevantNodeIds?.length || 0;
    let confirmationContent = '';

    if (nodeCount === 0) {
      confirmationContent =
        '💡 **General Context**\n\nNo specific context needed for this question.';
    } else if (nodeCount === 1) {
      confirmationContent = `✨ **Context Activated**\n\n📌 ${activatedNodesInfo[0]}\n\n_Using 1 relevant context item_`;
    } else if (nodeCount <= 3) {
      confirmationContent = `✨ **Context Activated** (${nodeCount} items)\n\n${activatedNodesInfo.map((name) => `📌 ${name}`).join('\n')}\n\n_Using specific context for your question_`;
    } else {
      const firstThree = activatedNodesInfo.slice(0, 3);
      const remaining = nodeCount - 3;
      confirmationContent = `✨ **Context Activated** (${nodeCount} items)\n\n${firstThree.map((name) => `📌 ${name}`).join('\n')}\n📌 _+${remaining} more..._\n\n_Using multiple relevant contexts_`;
    }

    if (activationMsg?.id) {
      updateMessage(activationMsg.id, { content: confirmationContent });
    }

    if (relevantNodeIds && relevantNodeIds.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      window.dispatchEvent(
        new CustomEvent('focus-active-nodes', {
          detail: { nodeIds: relevantNodeIds },
        })
      );
    }

    if (referenceNodesToOpen.length > 0) {
      await processGraphReferences(referenceNodesToOpen, command, config, aiService, (content) =>
        addAssistantMessage(content)
      );
    }

    const updatedNodes = useGraphStore.getState().nodes;
    const updatedEdges = useGraphStore.getState().edges;

    const activeContextNodes = await collectActiveContextRecursive(
      updatedNodes,
      currentGraph?.id || 'current',
      0,
      3,
      new Set()
    );

    if (relevantNodeIds && relevantNodeIds.length > 0) {
      try {
        await exportActiveContext(
          updatedNodes,
          updatedEdges,
          command,
          currentGraph?.id || 'current'
        );
        console.log('[ChatPanel] Context automatically saved to current-context.md');
      } catch (error) {
        console.warn('[ChatPanel] Failed to auto-save context:', error);
      }
    }

    const updatedContext = {
      nodes: activeContextNodes,
      edges: updatedEdges.map((e) => ({ source: e.source, target: e.target })),
      repository_owner: currentGraph?.repository_owner,
      repository_name: currentGraph?.repository_name,
      repository_branch: currentGraph?.repository_branch,
    };

    addMessage({ type: 'assistant', content: '' });
    const currentMessages2 = useChatsStore.getState().getCurrentChat()?.messages || [];
    const initialMsg = currentMessages2[currentMessages2.length - 1];

    if (!initialMsg?.id) {
      console.error('Failed to create initial message');
      setIsLoading(false);
      setIsStreaming(false);
      return;
    }

    let fullResponse = '';

    try {
      await aiService.regularCommandStream(
        command,
        updatedContext,
        conversationHistory,
        config,
        (chunk) => {
          fullResponse += chunk;
          flushSync(() => {
            updateMessage(initialMsg.id, { content: fullResponse });
          });
        },
        (ragContext) => {
          if (ragContext) {
            updateMessage(initialMsg.id, { ragContext });
          }
        },
        signal
      );

      const parsed = parseAIResponse(fullResponse);
      const codeActions = await createCodeActions(parsed.codeBlocks, parsed, initialMsg.id);

      if (codeActions.length > 0) {
        const contentWithoutCodeBlocks = parsed.textMessages.join('\n\n').trim();
        updateMessage(initialMsg.id, {
          content: contentWithoutCodeBlocks || 'Code changes detected:',
          codeActions,
        });
      }
    } catch (error) {
      console.error('Streaming error:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        updateMessage(initialMsg.id, { content: fullResponse + '\n\n_[Streaming interrompido]_' });
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (!fullResponse || fullResponse.trim() === '') {
          updateMessage(initialMsg.id, {
            content: `❌ **Error processing request**\n\n${errorMessage}\n\n_Please try again or check your settings._`,
          });
        } else {
          updateMessage(initialMsg.id, {
            content: fullResponse + `\n\n❌ _Error: ${errorMessage}_`,
          });
        }
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !isConfigured) return;

    let messageContent = inputValue;
    if (attachedFiles.length > 0) {
      messageContent += '\n\n--- Attached Files Context ---\n';
      attachedFiles.forEach((file) => {
        messageContent += `\n\nFile: ${file.path}\n`;
        messageContent += `\`\`\`${file.language || 'text'}\n${file.content}\n\`\`\`\n`;
      });
    }

    addMessage({ type: 'user', content: inputValue });
    const command = messageContent.trim();
    setInputValue('');
    clearFiles();

    setIsLoading(true);

    try {
      if (command.startsWith('/')) {
        addMessage({ type: 'assistant', content: '' });
        const currentMessages = useChatsStore.getState().getCurrentChat()?.messages || [];
        const loadingMsg = currentMessages[currentMessages.length - 1];
        if (loadingMsg?.id) {
          await handleSlashCommand(command, loadingMsg.id);
        }
      } else {
        await handleRegularCommand(command);
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);

      if (command.startsWith('/')) {
        const currentMessages = useChatsStore.getState().getCurrentChat()?.messages || [];
        const loadingMsg = currentMessages[currentMessages.length - 1];
        if (loadingMsg && loadingMsg.type === 'assistant') {
          updateMessage(loadingMsg.id, {
            content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      } else {
        addMessage({
          type: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryMessage = async (messageContent: string) => {
    if (!isConfigured || isLoading) return;

    setInputValue(messageContent);

    setTimeout(async () => {
      addMessage({ type: 'user', content: messageContent });
      const command = messageContent.trim();
      setInputValue('');
      clearFiles();

      setIsLoading(true);

      try {
        if (command.startsWith('/')) {
          addMessage({ type: 'assistant', content: '' });
          const currentMessages = useChatsStore.getState().getCurrentChat()?.messages || [];
          const loadingMsg = currentMessages[currentMessages.length - 1];
          if (loadingMsg?.id) {
            await handleSlashCommand(command, loadingMsg.id);
          }
        } else {
          await handleRegularCommand(command);
        }
      } catch (error) {
        console.error('Error in handleRetryMessage:', error);

        if (command.startsWith('/')) {
          const currentMessages = useChatsStore.getState().getCurrentChat()?.messages || [];
          const loadingMsg = currentMessages[currentMessages.length - 1];
          if (loadingMsg && loadingMsg.type === 'assistant') {
            updateMessage(loadingMsg.id, {
              content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          }
        } else {
          addMessage({
            type: 'assistant',
            content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      } finally {
        setIsLoading(false);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showFileAutoComplete) {
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }

    if (showCommandMenu) {
      const handled = handleKeyNavigation(e.key);
      if (handled) {
        e.preventDefault();
        if ((e.key === 'Tab' || e.key === 'Enter') && filteredCommands[selectedCommandIndex]) {
          const newValue = selectCommand(filteredCommands[selectedCommandIndex].command);
          setInputValue(newValue);
        }
      }
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey && !showCommandMenu && !showFileAutoComplete) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isConfigured) {
    return (
      <div className={`flex flex-col h-full bg-background ${className}`}>
        <ChatHeader chatName="AI Assistant" messageCount={0} onClear={() => {}} canClear={false} />

        <div className="flex-1 flex items-center justify-center p-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please configure your AI API keys in the settings to use the chat.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!currentGraph) {
    return (
      <div className={`flex flex-col h-full bg-background ${className}`}>
        <ChatHeader chatName="AI Assistant" messageCount={0} onClear={() => {}} canClear={false} />

        <div className="flex-1 flex items-center justify-center p-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please select or create a context graph to use the chat. Open a workspace or create a
              new graph to get started.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!workspace && !currentChatId) {
    return (
      <div className={`flex flex-col h-full bg-background ${className}`}>
        <ChatHeader chatName="AI Assistant" messageCount={0} onClear={() => {}} canClear={false} />

        <div className="flex-1 flex items-center justify-center p-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No workspace selected. Please open a workspace to start chatting.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const currentChat = getCurrentChat();

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      <ChatHeader
        chatName={currentChat?.name || 'Novo Chat'}
        messageCount={messages.length}
        onClear={clearCurrentChat}
        canClear={messages.length > 0}
      />

      <MessageList messages={messages} isLoading={isLoading} onRetry={handleRetryMessage} />

      <ChatInput
        inputValue={inputValue}
        onInputChange={(value) => {
          if (chatMode === 'command') {
            if (value === '' || value.startsWith('/')) {
              setInputValue(value);
            }
          } else {
            setInputValue(value);
          }
        }}
        onSend={handleSendMessage}
        onKeyDown={handleKeyDown}
        attachedFiles={attachedFiles}
        onRemoveFile={removeFile}
        showFileAutoComplete={showFileAutoComplete}
        fileQuery={fileQuery}
        onFileSelect={handleFileSelect}
        onCloseFileAutoComplete={() => setShowFileAutoComplete(false)}
        workspace={workspace}
        showCommandMenu={showCommandMenu}
        filteredCommands={filteredCommands}
        selectedCommandIndex={selectedCommandIndex}
        onSelectCommand={selectCommand}
        isStreaming={isStreaming}
        onStopStreaming={handleStopStreaming}
        isLoading={isLoading}
        chatMode={chatMode}
      />
    </div>
  );
};

export default ChatPanel;
