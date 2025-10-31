import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CodeDiffViewer } from '../editor/CodeDiffViewer';
import ChatLoadingDots from './ChatLoading';
import { ContentWithThinking } from './ThinkingBlock';
import type { RAGContext } from '@/services/ragService';

export interface CodeAction {
  filepath: string;
  code: string;
  language: string;
  description?: string;
  status: 'pending' | 'accepted' | 'rejected';
  isEdit: boolean;
  onAccept: () => Promise<void>;
  onReject: () => void;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  ragContext?: RAGContext | null;
  codeActions?: CodeAction[];
}

interface ChatMessageProps {
  message: Message;
  isLastMessage: boolean;
  isLoading: boolean;
  isSearchingRAG: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLastMessage,
  isLoading,
  isSearchingRAG,
}) => {
  return (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`relative max-w-[85%] ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}>
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
                {}
                {message.codeActions && message.codeActions.length > 0 ? (
                  <ContentWithThinking
                    content={message.content}
                    isStreaming={isLoading && isLastMessage}
                    renderContent={(content) => (
                      <div className="whitespace-pre-wrap text-foreground">
                        {content}
                        {}
                        {isLoading && isLastMessage && (
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
                    isStreaming={isLoading && isLastMessage}
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
                {}
                {isLoading && isLastMessage && (
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
                onAccept={action.onAccept}
                onReject={action.onReject}
              />
            ))}
          </div>
        )}

        <span className="text-xs opacity-60 mt-1 block">
          {message.timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
};
