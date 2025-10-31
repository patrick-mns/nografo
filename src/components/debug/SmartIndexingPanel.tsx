import { useState, useEffect } from 'react';
import { useSmartIndexing } from '@/hooks/useSmartIndexing';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Search, RefreshCw, Trash2, Database, File, Hash, Loader2 } from 'lucide-react';
import type { IndexingSearchResult } from '@/types/indexing';

export function SmartIndexingPanel() {
  const {
    isAvailable,
    isInitialized,
    isEnabled,
    stats,
    search,
    reindex,
    clearIndex,
    refreshStats,
  } = useSmartIndexing();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IndexingSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);

  useEffect(() => {
    if (isInitialized && isEnabled) {
      const interval = setInterval(() => {
        refreshStats();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isInitialized, isEnabled, refreshStats]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await search(searchQuery, 10);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReindex = async () => {
    if (!confirm('Reindex the entire workspace? This may take a few minutes.')) {
      return;
    }

    setIsReindexing(true);
    try {
      await reindex();
      await refreshStats();
      setSearchResults([]);
    } finally {
      setIsReindexing(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear the entire index? You will need to reindex again.')) {
      return;
    }

    await clearIndex();
    await refreshStats();
    setSearchResults([]);
  };

  if (!isAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Smart Indexing</CardTitle>
          <CardDescription>
            Indexing API not available. Make sure you are running in Electron.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isInitialized) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Smart Indexing
          </CardTitle>
          <CardDescription>
            Initializing indexing system... This may take a moment on first run.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>• Loading embedding model (~80MB download on first run)</p>
            <p>• Scanning workspace files</p>
            <p>• Building vector index</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Smart Indexing</CardTitle>
          <CardDescription>Indexing system is disabled. Enable it above to use.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Vector Database - Statistics
          </CardTitle>
          <CardDescription>Information about the semantic embeddings index</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <File className="h-4 w-4" />
                <span>Documentos</span>
              </div>
              <div className="text-2xl font-bold">{stats?.documentsCount || 0}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-4 w-4" />
                <span>Chunks</span>
              </div>
              <div className="text-2xl font-bold">{stats?.chunksCount || 0}</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Status</div>
              <div>
                {stats?.isIndexing ? (
                  <Badge variant="default" className="flex items-center gap-1 w-fit">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Indexing
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="w-fit">
                    Ready
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">State</div>
              <div>
                {stats?.enabled ? (
                  <Badge variant="default" className="bg-green-500 w-fit">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="w-fit">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              <strong>Index:</strong> {stats?.indexPath}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleReindex}
              disabled={isReindexing || stats?.isIndexing}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isReindexing ? 'animate-spin' : ''}`} />
              {isReindexing ? 'Reindexing...' : 'Reindex'}
            </Button>

            <Button
              onClick={handleClear}
              disabled={stats?.isIndexing || isReindexing}
              size="sm"
              variant="outline"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Index
            </Button>
          </div>
        </CardContent>
      </Card>

      {}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Test Semantic Search
          </CardTitle>
          <CardDescription>
            Search the vector database to see which chunks are returned
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Ex: authentication login function..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Results ({searchResults.length})</Label>
                <Button variant="ghost" size="sm" onClick={() => setSearchResults([])}>
                  Clear
                </Button>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {searchResults.map((result, index) => (
                  <Card
                    key={`${result.path}-${result.chunkIndex}-${index}`}
                    className="bg-muted/30"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-mono truncate" title={result.path}>
                            {result.path}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              Chunk #{result.chunkIndex}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-xs"
                              style={{
                                backgroundColor: `hsl(${result.score * 120}, 70%, 45%)`,
                                color: 'white',
                              }}
                            >
                              Score: {(result.score * 100).toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-background/50 p-3 rounded border border-border overflow-x-auto">
                        <code>{result.text}</code>
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !isSearching && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No results found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
