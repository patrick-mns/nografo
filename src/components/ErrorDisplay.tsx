import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  title: string;
  message: string;
  emoji?: string;
  onGoBack?: () => void;
  onRetry?: () => void;
  children?: ReactNode;
  className?: string;
}

function ErrorDisplay({
  title,
  message,
  emoji = '😞',
  onGoBack,
  onRetry,
  children,
  className = '',
}: ErrorDisplayProps) {
  const handleGoBackClick = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      console.warn('⚠️ onGoBack is not defined!');
    }
  };

  return (
    <div className={`flex items-center justify-center h-screen bg-background ${className}`}>
      <div className="text-center p-8 max-w-md">
        <div className="text-6xl mb-4">{emoji}</div>
        <h1 className="text-2xl font-bold text-foreground mb-4">{title}</h1>
        <p className="text-muted-foreground mb-6">{message}</p>
        <div className="space-y-3">
          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {onGoBack && (
            <Button
              onClick={handleGoBackClick}
              variant={onRetry ? 'outline' : 'default'}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export default ErrorDisplay;
