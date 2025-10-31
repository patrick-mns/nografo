import React, { useState } from 'react';
import GenericModal from '../ui/generic-modal';
import { Button } from '../ui/button';
import { Copy, Check, Download, Eye } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  code: string;
  language?: string;
  filename?: string;
}

const CodeModal: React.FC<CodeModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  code,
  language = 'json',
  filename,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `export.${language}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLanguageIcon = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'json':
        return '📄';
      case 'javascript':
      case 'js':
        return '🟨';
      case 'typescript':
      case 'ts':
        return '🔷';
      case 'python':
        return '🐍';
      default:
        return '📝';
    }
  };

  const modalTitle = (
    <>
      <Eye className="h-5 w-5 text-primary" />
      {title}
    </>
  );

  const modalFooter = (
    <div className="flex justify-between items-center w-full">
      <div className="text-xs text-muted-foreground">
        {code.length} characters • Generated at {new Date().toLocaleString()}
      </div>
      <Button onClick={onClose} variant="outline">
        Close
      </Button>
    </div>
  );

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      description={description}
      maxWidth="max-w-4xl"
      maxHeight="max-h-[80vh]"
      showCloseButton={false}
      footer={modalFooter}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {filename && (
              <span className="text-sm text-muted-foreground font-mono bg-muted px-3 py-1 rounded-full border">
                {filename}
              </span>
            )}
            <span className="text-xs text-muted-foreground uppercase bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20 font-medium flex items-center gap-1">
              <span>{getLanguageIcon(language)}</span>
              {language}
            </span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {code.split('\n').length} lines
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 transition-all ${
                copied ? 'border-green-500 text-green-600 bg-green-50' : ''
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>

            {filename && (
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden shadow-inner" style={{ height: '400px' }}>
          <div style={{ height: '100%', overflow: 'auto' }}>
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '1.5rem',
                background: 'hsl(var(--muted))',
                fontSize: '0.875rem',
                lineHeight: '1.6',
                borderRadius: '0.5rem',
              }}
              showLineNumbers={true}
              wrapLines={true}
              wrapLongLines={true}
              lineNumberStyle={{
                color: 'hsl(var(--muted-foreground))',
                paddingRight: '1rem',
                fontSize: '0.8rem',
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </GenericModal>
  );
};

export default CodeModal;
