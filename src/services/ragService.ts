import type { IndexingSearchResult } from '@/types/indexing';

export interface RAGOptions {
  k?: number;

  minScore?: number;

  maxTokens?: number;

  includePaths?: boolean;

  format?: 'compact' | 'detailed' | 'code-only';

  cacheTTL?: number;
}

export interface RAGContext {
  contextText: string;

  chunks: IndexingSearchResult[];

  stats: {
    chunksFound: number;
    chunksUsed: number;
    totalTokens: number;
    filesIncluded: string[];
  };

  cachedAt?: number;
}

interface CacheEntry {
  context: RAGContext;
  timestamp: number;
}

class ContextCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 50;

  get(key: string, ttl: number): RAGContext | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.context;
  }

  set(key: string, context: RAGContext): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      context,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

class RAGService {
  private cache = new ContextCache();
  private indexingAPI: any = null;

  constructor() {
    if (typeof window !== 'undefined' && window.electron?.indexing) {
      this.indexingAPI = window.electron.indexing;
    }
  }

  isAvailable(): boolean {
    const available = !!this.indexingAPI;

    if (available && typeof window !== 'undefined' && window.electron?.indexing) {
      window.electron.indexing
        .stats()
        .then(() => {})
        .catch((err) => {
          console.error('[RAG] Failed to check stats:', err);
        });
    }

    return available;
  }

  async getContext(query: string, options: RAGOptions = {}): Promise<RAGContext | null> {
    if (!this.isAvailable()) {
      console.warn('[RAG] Indexing API not available');
      return null;
    }

    const opts: Required<RAGOptions> = {
      k: options.k ?? 8,
      minScore: options.minScore ?? 0.65,
      maxTokens: options.maxTokens ?? 4000,
      includePaths: options.includePaths ?? true,
      format: options.format ?? 'detailed',
      cacheTTL: options.cacheTTL ?? 60000,
    };

    const cacheKey = this.getCacheKey(query, opts);
    const cached = this.cache.get(cacheKey, opts.cacheTTL);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.indexingAPI.search(query, opts.k);

      if (!result.success || !result.results || result.results.length === 0) {
        return this.createEmptyContext();
      }

      const filtered = result.results.filter((r: IndexingSearchResult) => r.score >= opts.minScore);

      if (filtered.length === 0) {
        return this.createEmptyContext();
      }

      const ranked = filtered.sort(
        (a: IndexingSearchResult, b: IndexingSearchResult) => b.score - a.score
      );

      const selected = this.selectChunksWithinTokenLimit(ranked, opts.maxTokens);

      const contextText = this.formatContext(selected.chunks, opts);

      const filesIncluded = Array.from(new Set(selected.chunks.map((c) => c.path)));

      const ragContext: RAGContext = {
        contextText,
        chunks: selected.chunks,
        stats: {
          chunksFound: result.results.length,
          chunksUsed: selected.chunks.length,
          totalTokens: selected.tokens,
          filesIncluded,
        },
        cachedAt: Date.now(),
      };

      this.cache.set(cacheKey, ragContext);

      return ragContext;
    } catch (error) {
      console.error('[RAG] ❌ Error getting context:', error);
      return null;
    }
  }

  private selectChunksWithinTokenLimit(
    chunks: IndexingSearchResult[],
    maxTokens: number
  ): { chunks: IndexingSearchResult[]; tokens: number } {
    const selected: IndexingSearchResult[] = [];
    let totalTokens = 0;

    for (const chunk of chunks) {
      const chunkTokens = this.estimateTokens(chunk.text);

      if (totalTokens + chunkTokens <= maxTokens) {
        selected.push(chunk);
        totalTokens += chunkTokens;
      } else {
        break;
      }
    }

    return { chunks: selected, tokens: totalTokens };
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private formatContext(chunks: IndexingSearchResult[], options: Required<RAGOptions>): string {
    if (chunks.length === 0) return '';

    const { format, includePaths } = options;

    const byFile = new Map<string, IndexingSearchResult[]>();
    for (const chunk of chunks) {
      const existing = byFile.get(chunk.path) || [];
      existing.push(chunk);
      byFile.set(chunk.path, existing);
    }

    const sections: string[] = [];

    if (format === 'compact') {
      for (const [path, fileChunks] of byFile) {
        const header = includePaths ? `[${path}]` : '';
        const content = fileChunks.map((c) => c.text).join('\n...\n');
        sections.push(header ? `${header}\n${content}` : content);
      }
    } else if (format === 'code-only') {
      for (const fileChunks of byFile.values()) {
        sections.push(fileChunks.map((c) => c.text).join('\n\n'));
      }
    } else {
      for (const [path, fileChunks] of byFile) {
        const relevanceScore = (
          fileChunks.reduce((sum, c) => sum + c.score, 0) / fileChunks.length
        ).toFixed(2);

        sections.push(
          `File: ${path} (relevance: ${relevanceScore})`,
          '---',
          ...fileChunks.map((c, i) => `[Chunk ${i + 1}/${fileChunks.length}]\n${c.text}`),
          ''
        );
      }
    }

    return sections.join('\n');
  }

  private createEmptyContext(): RAGContext {
    return {
      contextText: '',
      chunks: [],
      stats: {
        chunksFound: 0,
        chunksUsed: 0,
        totalTokens: 0,
        filesIncluded: [],
      },
    };
  }

  private getCacheKey(query: string, options: Required<RAGOptions>): string {
    return JSON.stringify({ query, ...options });
  }

  clearCache(): void {
    this.cache.clear();
  }

  async enhancePrompt(
    userMessage: string,
    systemPrompt: string,
    options: RAGOptions = {}
  ): Promise<{
    userMessage: string;
    systemPrompt: string;
    ragContext: RAGContext | null;
  }> {
    const ragContext = await this.getContext(userMessage, options);

    if (!ragContext || ragContext.chunks.length === 0) {
      return {
        userMessage,
        systemPrompt,
        ragContext: null,
      };
    }

    const enhancedSystemPrompt = `${systemPrompt}

You have access to relevant code from the workspace. Use this context to provide accurate, specific answers.

===== RELEVANT WORKSPACE CONTEXT =====
${ragContext.contextText}
===== END CONTEXT =====

When answering:
- Reference specific files/functions from the context when relevant
- If the context doesn't contain needed information, say so
- Prefer concrete examples from the actual codebase`;

    return {
      userMessage,
      systemPrompt: enhancedSystemPrompt,
      ragContext,
    };
  }
}

export const ragService = new RAGService();
