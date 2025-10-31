import React from 'react';

interface ChatLoadingDotsProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const ChatLoadingDots: React.FC<ChatLoadingDotsProps> = ({
  className = '',
  size = 'sm',
}) => {
  const dotSize = size === 'sm' ? 'w-1 h-1' : 'w-2 h-2';
  const dotColor = size === 'sm' ? 'bg-primary' : 'bg-foreground/40';

  return (
    <span className={`inline-flex gap-1 ${className}`}>
      <span
        className={`${dotSize} ${dotColor} rounded-full animate-bounce`}
        style={{ animationDelay: '0ms' }}
      />
      <span
        className={`${dotSize} ${dotColor} rounded-full animate-bounce`}
        style={{ animationDelay: '150ms' }}
      />
      <span
        className={`${dotSize} ${dotColor} rounded-full animate-bounce`}
        style={{ animationDelay: '300ms' }}
      />
    </span>
  );
};

export default ChatLoadingDots;
