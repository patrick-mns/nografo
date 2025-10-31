import React, { useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Eye, Copy, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { isElectron, getWorkspaceAPI } from '@/lib/electron';
import { virtualWorkspaceManager } from '@/lib/virtualWorkspace';
import { useToast } from '@/hooks/useToast';

export const MarkdownPreview: React.FC = () => {
  const [markdown, setMarkdown] = useState('');
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const workspaceAPI = getWorkspaceAPI();

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Context copied to clipboard',
      });
    } catch (err) {
      console.error('Failed to copy markdown:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to copy to clipboard',
      });
    }
  };

  const loadMarkdownFromFile = useCallback(async () => {
    const isElectronEnv = isElectron();

    try {
      let fileContent;

      if (isElectronEnv && workspaceAPI) {
        fileContent = await workspaceAPI.readFile('.nografo/current-context.md');
      } else {
        fileContent = await virtualWorkspaceManager.readFile('.nografo/current-context.md');
      }

      setMarkdown(
        fileContent.content ||
          '# No Context\n\nNo active context found in `.nografo/current-context.md`.'
      );
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error reading .nografo/current-context.md:', error);

      if (isElectronEnv) {
        setMarkdown(
          '# Error Loading Context\n\nCould not read `.nografo/current-context.md`. Make sure the file exists.'
        );
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load current-context.md',
        });
      } else {
        setMarkdown(
          '# No Context Available\n\nNo context has been generated yet. Create some nodes and they will automatically appear here.'
        );
      }
    }
  }, [workspaceAPI, toast]);

  useEffect(() => {
    loadMarkdownFromFile();

    const interval = setInterval(loadMarkdownFromFile, 2000);

    return () => clearInterval(interval);
  }, [loadMarkdownFromFile]);

  return (
    <div className="flex flex-col h-full bg-background">
      {}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Context Preview</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyMarkdown}
          className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
          title="Copy context to clipboard"
          disabled={!markdown}
        >
          {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>

      {}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {markdown ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }: React.ComponentProps<'code'>) {
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
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold mb-4 text-foreground border-b pb-2">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold mb-3 mt-6 text-foreground">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium mb-2 mt-4 text-foreground">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-3 text-sm text-muted-foreground leading-relaxed">{children}</p>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic my-3 text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm text-muted-foreground">{children}</li>
                  ),
                  hr: () => <hr className="my-4 border-border" />,
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Eye className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm">No active context to preview</p>
            </div>
          )}
        </div>
      </div>

      {}
      <div className="p-2 border-t border-border bg-card">
        <p className="text-xs text-muted-foreground text-center">
          Last updated: {new Date(lastUpdate).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};
