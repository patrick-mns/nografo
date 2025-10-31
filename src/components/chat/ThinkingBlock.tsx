import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ThinkingBlockProps {
  content: string;
  defaultOpen?: boolean;
  isStreaming?: boolean;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  content,
  defaultOpen = false,
  isStreaming = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="my-4 border border-primary/20 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/10 transition-all duration-200 group"
      >
        <div className="flex items-center gap-2 flex-1">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-primary flex-shrink-0 transition-transform duration-200" />
          ) : (
            <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 transition-transform duration-200" />
          )}
          {isStreaming ? (
            <Loader2 className="h-4 w-4 text-primary flex-shrink-0 animate-spin" />
          ) : (
            <Brain className="h-4 w-4 text-primary flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
          )}
          <span className="text-sm font-semibold text-primary/90">
            {isStreaming ? 'Pensando...' : isOpen ? 'Raciocínio da IA' : 'Ver raciocínio da IA'}
          </span>
        </div>
        {!isStreaming && (
          <Sparkles className="h-3.5 w-3.5 text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 py-3 border-t border-primary/20 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="text-sm text-foreground/80 leading-relaxed">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => <li className="text-foreground/70">{children}</li>,
                  code: ({ children }) => (
                    <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">
                      {children}
                    </code>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  em: ({ children }) => <em className="italic text-foreground/70">{children}</em>,
                }}
              >
                {content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-flex items-center gap-1 text-primary/60 text-xs mt-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Recebendo...</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export function parseThinkingTags(
  content: string,
  isStreaming: boolean = false
): {
  hasThinking: boolean;
  thinkingBlocks: Array<{ content: string; isComplete: boolean }>;
  contentWithoutThinking: string;
  hasIncompleteTag: boolean;
} {
  const thinkingBlocks: Array<{ content: string; isComplete: boolean }> = [];
  let processedContent = content;

  const completeTagRegex = /<(thinking|thing|think)>([\s\S]*?)<\/(thinking|thing|think)>/gi;

  let match;
  const completeMatches: Array<{
    fullMatch: string;
    tagName: string;
    content: string;
    index: number;
  }> = [];

  while ((match = completeTagRegex.exec(content)) !== null) {
    completeMatches.push({
      fullMatch: match[0],
      tagName: match[1],
      content: match[2].trim(),
      index: match.index,
    });
  }

  completeMatches.forEach((m) => {
    thinkingBlocks.push({ content: m.content, isComplete: true });
  });

  completeMatches.forEach((m) => {
    processedContent = processedContent.replace(m.fullMatch, '');
  });

  let hasIncompleteTag = false;
  if (isStreaming) {
    const incompleteTagRegex = /<(thinking|thing|think)>([\s\S]*)$/i;
    const incompleteMatch = processedContent.match(incompleteTagRegex);

    if (incompleteMatch) {
      hasIncompleteTag = true;
      const incompleteContent = incompleteMatch[2].trim();

      if (incompleteContent.length > 0) {
        thinkingBlocks.push({ content: incompleteContent, isComplete: false });
      }

      processedContent = processedContent.replace(incompleteTagRegex, '');
    }
  }

  return {
    hasThinking: thinkingBlocks.length > 0,
    thinkingBlocks,
    contentWithoutThinking: processedContent.trim(),
    hasIncompleteTag,
  };
}

interface ContentWithThinkingProps {
  content: string;
  renderContent: (content: string) => React.ReactNode;
  defaultThinkingOpen?: boolean;
  isStreaming?: boolean;
}

export const ContentWithThinking: React.FC<ContentWithThinkingProps> = ({
  content,
  renderContent,
  defaultThinkingOpen = false,
  isStreaming = false,
}) => {
  const { hasThinking, thinkingBlocks, contentWithoutThinking } = parseThinkingTags(
    content,
    isStreaming
  );

  if (!hasThinking) {
    return <>{renderContent(content)}</>;
  }

  return (
    <>
      {thinkingBlocks.map((thinking, index) => (
        <ThinkingBlock
          key={index}
          content={thinking.content}
          defaultOpen={defaultThinkingOpen || (isStreaming && !thinking.isComplete)}
          isStreaming={isStreaming && !thinking.isComplete}
        />
      ))}
      {contentWithoutThinking && renderContent(contentWithoutThinking)}
    </>
  );
};
