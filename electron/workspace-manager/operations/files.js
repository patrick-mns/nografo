const fs = require('fs').promises;
const path = require('path');

class FilesOperations {
  constructor(logger) {
    this.logger = logger;
  }

  async listFiles(workspacePath, dirPath = '') {
    if (!workspacePath) {
      throw new Error('No workspace selected');
    }

    const fullPath = path.join(workspacePath, dirPath);
    const excludeDirs = ['.nografo', 'node_modules', '.git', 'dist', 'build', '.next', 'coverage'];

    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const items = [];

      for (const entry of entries) {
        
        if (excludeDirs.includes(entry.name) || entry.name.startsWith('.')) {
          continue;
        }

        const relativePath = path.join(dirPath, entry.name);

        items.push({
          name: entry.name,
          path: relativePath,
          isDirectory: entry.isDirectory(),
          isFile: entry.isFile(),
        });
      }

      return items.sort((a, b) => {
        
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      this.logger.error('Failed to list files', { error: error.message, path: fullPath });
      return [];
    }
  }

  async readFile(workspacePath, filePath) {
    if (!workspacePath) {
      throw new Error('No workspace selected');
    }

    const fullPath = path.join(workspacePath, filePath);

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const stats = await fs.stat(fullPath);

      return {
        content,
        size: stats.size,
        path: filePath,
        name: path.basename(filePath),
        extension: path.extname(filePath),
      };
    } catch (error) {
      this.logger.error('Failed to read file', { error: error.message, path: fullPath });
      throw error;
    }
  }

  async writeFile(workspacePath, filePath, content) {
    if (!workspacePath) {
      throw new Error('No workspace selected');
    }

    const fullPath = path.join(workspacePath, filePath);

    try {
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(fullPath, content, 'utf-8');

      this.logger.info('File written successfully', {
        path: filePath,
        size: Buffer.byteLength(content, 'utf-8'),
      });

      return {
        success: true,
        path: filePath,
        size: Buffer.byteLength(content, 'utf-8'),
      };
    } catch (error) {
      this.logger.error('Failed to write file', { error: error.message, path: fullPath });
      throw error;
    }
  }
}

module.exports = FilesOperations;
