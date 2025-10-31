import { useState } from 'react';

export interface AttachedFile {
  path: string;
  content: string;
  language: string;
  size: number;
}

const getLanguageFromExtension = (filePath: string): string => {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    go: 'go',
    rs: 'rust',
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
  };
  return langMap[ext || ''] || ext || 'text';
};

export const useFileAttachments = () => {
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  const attachFile = async (filePath: string) => {
    if (!window.electron?.git?.readFile) {
      console.error('Electron git manager not available');
      return false;
    }

    try {
      const result = await window.electron.git.readFile(filePath);
      if (result.success && result.content) {
        const newFile: AttachedFile = {
          path: filePath,
          content: result.content,
          language: getLanguageFromExtension(filePath),
          size: result.content.length,
        };
        setAttachedFiles((prev) => [...prev, newFile]);
        return true;
      } else {
        console.error('Failed to read file:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error attaching file:', error);
      return false;
    }
  };

  const removeFile = (filePath: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.path !== filePath));
  };

  const clearFiles = () => {
    setAttachedFiles([]);
  };

  const buildMessageWithFiles = (message: string): string => {
    if (attachedFiles.length === 0) return message;

    let messageContent = message;
    messageContent += '\n\n--- Attached Files Context ---\n';
    attachedFiles.forEach((file) => {
      messageContent += `\n\nFile: ${file.path}\n`;
      messageContent += `\`\`\`${file.language || 'text'}\n${file.content}\n\`\`\`\n`;
    });

    return messageContent;
  };

  return {
    attachedFiles,
    attachFile,
    removeFile,
    clearFiles,
    buildMessageWithFiles,
  };
};
