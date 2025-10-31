const path = require('path');
const fs = require('fs').promises;
const chokidar = require('chokidar');
const hnswlib = require('hnswlib-node');
const { pipeline } = require('@xenova/transformers');
const logger = require('../logger');

const log = logger.createNamespace('IndexingManager');

class IndexingManager {
  constructor() {
    this.index = null;
    this.indexPath = null;
    this.embeddings = null;
    this.documents = new Map();
    this.watcher = null;
    this.isEnabled = true;
    this.isIndexing = false;
    this.embeddingModel = null;

    this.config = {
      extensions: ['.js', '.ts', '.tsx', '.jsx', '.py', '.md', '.json', '.css', '.html'],
      chunkSize: 512,
      chunkOverlap: 50,
      ignoreDirs: [
        'node_modules',
        '.git',
        'dist',
        'build',
        '.next',
        'coverage',
        '.indexing',
        '.nografo',
      ],
      embeddingDim: 384,
      maxNeighbors: 10,
    };
  }

  async initialize(workspacePath, indexStoragePath) {
    logger.info('[IndexingManager] Initializing');

    this.workspacePath = workspacePath;
    this.indexPath = path.join(indexStoragePath, '.indexing');

    await fs.mkdir(this.indexPath, { recursive: true });
    await this.loadEmbeddingModel();

    const loaded = await this.loadIndex();

    if (!loaded && this.isEnabled) {
      // Create index in background without blocking
      this.createIndex().catch((error) => {
        logger.error('[IndexingManager] Background indexing failed', error);
      });
    }

    if (this.isEnabled) {
      this.startWatcher();
    }

    logger.info('[IndexingManager] Initialized successfully (indexing in background)');
  }

  async loadEmbeddingModel() {
    try {
      logger.info('[IndexingManager] Loading embedding model (Xenova/all-MiniLM-L6-v2)');

      this.embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        progress_callback: (progress) => {
          if (progress.status === 'downloading') {
            const percent = ((progress.loaded / progress.total) * 100).toFixed(1);
            logger.debug(`[IndexingManager] Downloading: ${percent}%`);
          }
        },
      });

      logger.info('[IndexingManager] Model loaded');
    } catch (error) {
      logger.error('[IndexingManager] Failed to load model', error);
      throw error;
    }
  }

  async generateEmbedding(text) {
    if (!this.embeddingModel) {
      throw new Error('Embedding model not loaded');
    }

    try {
      const output = await this.embeddingModel(text, {
        pooling: 'mean',
        normalize: true,
      });

      return Array.from(output.data);
    } catch (error) {
      log.error('Failed to generate embedding', error);
      throw error;
    }
  }

  async createIndex() {
    log.info('Creating new index');

    this.index = new hnswlib.HierarchicalNSW('l2', this.config.embeddingDim);
    this.index.initIndex(10000, 16, 200, 100);

    await this.indexWorkspace();
    await this.saveIndex();

    log.info('Index created');
  }

  async loadIndex() {
    try {
      const indexFile = path.join(this.indexPath, 'index.bin');
      const metadataFile = path.join(this.indexPath, 'metadata.json');

      await fs.access(indexFile);
      await fs.access(metadataFile);

      this.index = new hnswlib.HierarchicalNSW('l2', this.config.embeddingDim);
      this.index.readIndex(indexFile, 10000);

      const metadata = await fs.readFile(metadataFile, 'utf-8');
      const data = JSON.parse(metadata);

      this.documents = new Map(Object.entries(data.documents));

      log.info('Index loaded', { documentsCount: this.documents.size });

      return true;
    } catch (error) {
      return false;
    }
  }

  async saveIndex() {
    try {
      const indexFile = path.join(this.indexPath, 'index.bin');
      const metadataFile = path.join(this.indexPath, 'metadata.json');

      this.index.writeIndex(indexFile);

      const metadata = {
        version: '1.0',
        documents: Object.fromEntries(this.documents),
        config: this.config,
        lastUpdated: new Date().toISOString(),
      };

      await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));

      log.info('Index saved');
    } catch (error) {
      log.error('Failed to save index', error);
      throw error;
    }
  }

  async indexWorkspace() {
    if (!this.isEnabled) return;

    this.isIndexing = true;
    log.info('Starting workspace indexing');

    try {
      const files = await this.scanWorkspace();
      log.info('Files found', { count: files.length });

      let indexed = 0;
      const startTime = Date.now();

      for (const filePath of files) {
        try {
          await this.indexFile(filePath);
          indexed++;

          if (indexed % 10 === 0) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            log.info('Indexing progress', { indexed, total: files.length, elapsed });
          }
        } catch (error) {
          log.error('Failed to index file', {
            file: path.relative(this.workspacePath, filePath),
            error: error.message,
          });
        }
      }

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      log.info('Indexing complete', { indexed, totalTime });
    } finally {
      this.isIndexing = false;
    }
  }

  async scanWorkspace() {
    const files = [];

    async function scan(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            if (!this.config.ignoreDirs.includes(entry.name)) {
              await scan.call(this, fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (this.config.extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        log.error('Error scanning directory', { dir, error: error.message });
      }
    }

    await scan.call(this, this.workspacePath);
    return files;
  }

  async indexFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const chunks = this.chunkText(content);
      const fileId = this.getFileId(filePath);
      const chunkData = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await this.generateEmbedding(chunk);
        const label = this.documents.size + i;

        this.index.addPoint(embedding, label);

        chunkData.push({
          text: chunk,
          index: i,
          label,
        });
      }

      this.documents.set(fileId, {
        path: filePath,
        relativePath: path.relative(this.workspacePath, filePath),
        chunks: chunkData,
        indexed: new Date().toISOString(),
      });
    } catch (error) {
      throw new Error(`Failed to index ${filePath}: ${error.message}`);
    }
  }

  async removeFile(filePath) {
    const fileId = this.getFileId(filePath);

    if (this.documents.has(fileId)) {
      this.documents.delete(fileId);
      log.debug('File removed from index', { filePath });
    }
  }

  async updateFile(filePath) {
    await this.removeFile(filePath);
    await this.indexFile(filePath);
    log.debug('File updated in index', { filePath });
  }

  chunkText(text) {
    const chunks = [];
    const lines = text.split('\n');
    let currentChunk = '';

    for (const line of lines) {
      if (currentChunk.length + line.length > this.config.chunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        const overlap = currentChunk.slice(-this.config.chunkOverlap);
        currentChunk = overlap + line + '\n';
      } else {
        currentChunk += line + '\n';
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  async search(query, k = 5) {
    if (!this.isEnabled || !this.index || this.documents.size === 0) {
      return [];
    }

    try {
      const queryEmbedding = await this.generateEmbedding(query);
      const numNeighbors = Math.min(k, this.config.maxNeighbors);
      const result = this.index.searchKnn(queryEmbedding, numNeighbors);

      const results = [];
      const neighbors = result.neighbors || [];
      const distances = result.distances || [];

      for (let i = 0; i < neighbors.length; i++) {
        const label = neighbors[i];
        const distance = distances[i];

        for (const [fileId, doc] of this.documents.entries()) {
          const chunk = doc.chunks.find((c) => c.label === label);
          if (chunk) {
            results.push({
              path: doc.relativePath,
              fullPath: doc.path,
              text: chunk.text,
              chunkIndex: chunk.index,
              score: 1 / (1 + distance),
            });
            break;
          }
        }
      }

      return results;
    } catch (error) {
      log.error('Search failed', error);
      throw error;
    }
  }

  startWatcher() {
    if (this.watcher || !this.isEnabled) return;

    log.info('Starting file watcher');

    const patterns = this.config.extensions.map((ext) => `**/*${ext}`);

    this.watcher = chokidar.watch(patterns, {
      cwd: this.workspacePath,
      ignored: this.config.ignoreDirs.map((dir) => `**/${dir}/**`),
      persistent: true,
      ignoreInitial: true,
    });

    const updateQueue = new Map();
    const processQueue = async () => {
      const files = Array.from(updateQueue.keys());
      updateQueue.clear();

      for (const file of files) {
        try {
          await this.updateFile(file);
        } catch (error) {
          log.error('Failed to update file', { file, error: error.message });
        }
      }

      if (files.length > 0) {
        await this.saveIndex();
      }
    };

    let timeoutId = null;
    const scheduleProcess = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(processQueue, 2000);
    };

    this.watcher
      .on('add', (filePath) => {
        const fullPath = path.join(this.workspacePath, filePath);
        if (fullPath.includes('.indexing')) return;
        log.debug('File added', { filePath });
        updateQueue.set(fullPath, 'add');
        scheduleProcess();
      })
      .on('change', (filePath) => {
        const fullPath = path.join(this.workspacePath, filePath);
        if (fullPath.includes('.indexing')) return;
        log.debug('File changed', { filePath });
        updateQueue.set(fullPath, 'change');
        scheduleProcess();
      })
      .on('unlink', (filePath) => {
        const fullPath = path.join(this.workspacePath, filePath);
        if (fullPath.includes('.indexing')) return;
        log.debug('File removed', { filePath });
        this.removeFile(fullPath);
        scheduleProcess();
      });
  }

  stopWatcher() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      log.info('File watcher stopped');
    }
  }

  setEnabled(enabled) {
    log.info('Setting indexing enabled', { enabled });
    this.isEnabled = enabled;

    if (enabled) {
      this.startWatcher();
    } else {
      this.stopWatcher();
    }
  }

  getFileId(filePath) {
    return path.relative(this.workspacePath, filePath);
  }

  getStats() {
    const totalChunks = Array.from(this.documents.values()).reduce(
      (sum, doc) => sum + doc.chunks.length,
      0
    );

    return {
      enabled: this.isEnabled,
      isIndexing: this.isIndexing,
      isInitialized: this.index !== null,
      documentsCount: this.documents.size,
      chunksCount: totalChunks,
      indexPath: this.indexPath,
    };
  }

  async clearIndex() {
    log.info('Clearing index');

    this.stopWatcher();
    this.documents.clear();

    if (this.index) {
      this.index = new hnswlib.HierarchicalNSW('l2', this.config.embeddingDim);
      this.index.initIndex(10000, 16, 200, 100);
    }

    await this.saveIndex();

    if (this.isEnabled) {
      this.startWatcher();
    }

    log.info('Index cleared');
  }

  async shutdown() {
    log.info('Shutting down');

    this.stopWatcher();

    if (this.index && this.documents.size > 0) {
      await this.saveIndex();
    }

    log.info('Shutdown complete');
  }
}

module.exports = IndexingManager;
