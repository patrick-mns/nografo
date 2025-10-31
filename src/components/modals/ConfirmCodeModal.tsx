import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ConfirmCodeModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  code: string;
  language?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmCodeModal: React.FC<ConfirmCodeModalProps> = ({
  isOpen,
  title,
  description,
  code,
  language = 'typescript',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {}
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        {}
        <div className="flex-1 overflow-auto p-4">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
            showLineNumbers
          >
            {code}
          </SyntaxHighlighter>
        </div>

        {}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <Button onClick={onCancel} variant="outline" className="flex items-center gap-2">
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          >
            <Check className="w-4 h-4" />
            Apply Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
