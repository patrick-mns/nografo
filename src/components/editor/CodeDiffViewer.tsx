import React, { useState, useEffect } from 'react';
import { Check, X, FileText, GitCompare } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeDiffViewerProps {
  filepath: string;
  code: string;
  language?: string;
  description?: string;
  onAccept: () => void;
  onReject: () => void;
  status?: 'pending' | 'accepted' | 'rejected';
  isEdit?: boolean;
}

function generateUnifiedDiff(oldContent: string, newContent: string): string {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  const diffLines: string[] = [];
  let i = 0,
    j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i >= oldLines.length) {
      diffLines.push(`+ ${newLines[j]}`);
      j++;
    } else if (j >= newLines.length) {
      diffLines.push(`- ${oldLines[i]}`);
      i++;
    } else if (oldLines[i] === newLines[j]) {
      diffLines.push(`  ${oldLines[i]}`);
      i++;
      j++;
    } else {
      diffLines.push(`- ${oldLines[i]}`);
      diffLines.push(`+ ${newLines[j]}`);
      i++;
      j++;
    }
  }

  return diffLines.join('\n');
}

export const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({
  filepath,
  code,
  language = 'typescript',
  onAccept,
  onReject,
  status = 'pending',
  isEdit = false,
}) => {
  const [oldContent, setOldContent] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [loadingOldContent, setLoadingOldContent] = useState(false);

  useEffect(() => {
    if (isEdit && status === 'pending') {
      loadOldFileContent();
    }
  }, [isEdit, filepath, status]);

  const loadOldFileContent = async () => {
    setLoadingOldContent(true);
    try {
      if (window.electron?.git?.readFile) {
        const result = await window.electron.git.readFile(filepath);

        const content = typeof result === 'string' ? result : result?.content || '';
        setOldContent(content);
        setShowDiff(true);
      }
    } catch (error) {
      console.error('Error loading old file content:', error);
      setOldContent(null);
    } finally {
      setLoadingOldContent(false);
    }
  };

  const displayContent = oldContent && showDiff ? generateUnifiedDiff(oldContent, code) : code;

  const displayLanguage = oldContent && showDiff ? 'diff' : language;

  return (
    <div className="border border-border/50 rounded-md overflow-hidden my-2 bg-[#1e1e1e]">
      {}
      <div className="px-3 py-1.5 bg-[#252526] border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{filepath}</span>
          {isEdit && oldContent && (
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="px-1.5 py-0.5 text-xs rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              title={showDiff ? 'Show new content' : 'Show diff'}
            >
              {showDiff ? <FileText className="w-3 h-3" /> : <GitCompare className="w-3 h-3" />}
              {showDiff ? 'New' : 'Diff'}
            </button>
          )}
          {loadingOldContent && <span className="text-xs text-muted-foreground">Loading...</span>}
        </div>

        {status === 'pending' && (
          <div className="flex gap-1">
            <button
              onClick={onReject}
              className="px-1.5 py-0.5 text-xs rounded hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors flex items-center justify-center min-w-[24px]"
              title="Reject changes"
            >
              <X className="w-3 h-3" />
              <span className="ml-1 hidden [@media(min-width:400px)]:inline">Reject</span>
            </button>
            <button
              onClick={onAccept}
              className="px-1.5 py-0.5 text-xs rounded bg-green-600 hover:bg-green-500 text-white transition-colors flex items-center justify-center font-medium min-w-[24px]"
              title="Accept changes"
            >
              <Check className="w-3 h-3" />
              <span className="ml-1 hidden [@media(min-width:400px)]:inline">Accept</span>
            </button>
          </div>
        )}

        {status === 'accepted' && (
          <span className="text-xs text-green-400 flex items-center gap-1 font-medium">
            <Check className="w-3 h-3" />
            Applied
          </span>
        )}

        {status === 'rejected' && (
          <span className="text-xs text-red-400 flex items-center gap-1">
            <X className="w-3 h-3" />
            Rejected
          </span>
        )}
      </div>

      {}
      <div className="max-h-[300px] overflow-auto text-xs">
        <SyntaxHighlighter
          language={displayLanguage}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '8px 12px',
            borderRadius: 0,
            fontSize: '0.75rem',
            lineHeight: '1.4',
            background: '#1e1e1e',
          }}
          showLineNumbers={!showDiff}
          wrapLines
          lineNumberStyle={{
            minWidth: '2em',
            paddingRight: '1em',
            color: '#858585',
            fontSize: '0.7rem',
          }}
          lineProps={(lineNumber) => {
            if (showDiff && oldContent) {
              const line = displayContent.split('\n')[lineNumber - 1];
              if (line?.startsWith('+ ')) {
                return {
                  style: {
                    backgroundColor: 'rgba(46, 160, 67, 0.15)',
                    display: 'block',
                  },
                };
              }
              if (line?.startsWith('- ')) {
                return {
                  style: {
                    backgroundColor: 'rgba(248, 81, 73, 0.15)',
                    display: 'block',
                  },
                };
              }
            }
            return {};
          }}
        >
          {displayContent}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};
