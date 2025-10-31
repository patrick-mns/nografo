import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, RotateCcw } from 'lucide-react';
import { CodeDiffViewer } from '../editor/CodeDiffViewer';
import { Button } from '../ui/button';
import ChatLoadingDots from './ChatLoading';
import { ContentWithThinking } from './ThinkingBlock';
import type { RAGContext } from '@/services/ragService';

export interface CodeAction {
  filepath: string;
  code: string;
  language: string;
  description?: string;
  status: 'pending' | 'accepted' | 'rejected';
  isEdit?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  ragContext?: RAGContext | null;
  codeActions?: CodeAction[];
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onRetry?: (messageContent: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, onRetry }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isLastMessage = (message: Message) => {
    return messages[messages.length - 1]?.id === message.id;
  };

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleRetryMessage = (content: string) => {
    if (onRetry) {
      onRetry(content);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-2`}
        >
          <div
            className={`group relative max-w-[85%] ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}
          >
            {}
            <div
              className={`rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}
            >
              <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                {message.type === 'assistant' ? (
                  <>
                    {message.codeActions && message.codeActions.length > 0 ? (
                      <ContentWithThinking
                        content={message.content}
                        isStreaming={isLoading && isLastMessage(message)}
                        renderContent={(content) => (
                          <div className="whitespace-pre-wrap text-foreground">
                            {content}
                            {isLoading && isLastMessage(message) && (
                              <span className="inline-flex gap-1 ml-1">
                                <ChatLoadingDots />
                              </span>
                            )}
                          </div>
                        )}
                      />
                    ) : (
                      <ContentWithThinking
                        content={message.content}
                        isStreaming={isLoading && isLastMessage(message)}
                        renderContent={(content) => (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({ node, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                const language = match ? match[1] : '';
                                const inline = !language;

                                return inline ? (
                                  <code
                                    className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                ) : (
                                  <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={language}
                                    PreTag="div"
                                    className="rounded-md text-xs !mt-2 !mb-2"
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                );
                              },
                            }}
                          >
                            {content}
                          </ReactMarkdown>
                        )}
                      />
                    )}
                    {isLoading && isLastMessage(message) && (
                      <div className="flex gap-1 mt-1">
                        <ChatLoadingDots />
                      </div>
                    )}
                  </>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>

            {}
            {message.codeActions && message.codeActions.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.codeActions.map((action, index) => (
                  <CodeDiffViewer
                    key={`${message.id}-action-${index}`}
                    filepath={action.filepath}
                    code={action.code}
                    language={action.language}
                    status={action.status}
                    isEdit={action.isEdit}
                    onAccept={action.onAccept || (() => {})}
                    onReject={action.onReject || (() => {})}
                  />
                ))}
              </div>
            )}

            <div
              className={`flex items-center gap-2 mt-1 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'user' ? (
                <>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-60 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRetryMessage(message.content)}
                      className="h-6 w-6 p-0 hover:opacity-100 transition-opacity"
                      title="Retry message"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyMessage(message.id, message.content)}
                      className="h-6 w-6 p-0 hover:opacity-100 transition-opacity"
                      title="Copy message"
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <span className="text-xs opacity-60">
                    {message.timestamp.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs opacity-60">
                    {message.timestamp.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyMessage(message.id, message.content)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
                    title="Copy message"
                  >
                    {copiedMessageId === message.id ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
};
