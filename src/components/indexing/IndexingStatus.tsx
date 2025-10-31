import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSmartIndexing } from '@/hooks/useSmartIndexing';

export function IndexingStatus() {
  const { stats, isAvailable, isEnabled } = useSmartIndexing();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (stats?.isIndexing) {
      setShow(true);
    } else if (show) {
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [stats?.isIndexing, show]);

  if (!isAvailable || !isEnabled || !show) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-background border border-border rounded-lg px-4 py-2 shadow-lg flex items-center gap-2 z-50">
      {stats?.isIndexing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Indexing workspace... ({stats?.documentsCount || 0} files)
          </span>
        </>
      ) : (
        <>
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm text-muted-foreground">
            Indexing complete ({stats?.documentsCount || 0} files)
          </span>
        </>
      )}
    </div>
  );
}
