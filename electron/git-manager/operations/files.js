const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');

class FileOperations {
  constructor(logger, stagingOps) {
    this.logger = logger;
    this.stagingOps = stagingOps;
  }

  async create(activeRepo, filepath, content) {
    if (!activeRepo) {
      throw new Error('No active repository');
    }

    try {
      const fullPath = path.join(activeRepo, filepath);
      const dir = path.dirname(fullPath);

      this.logger.info(`Creating file: ${filepath}`);

      await fs.promises.mkdir(dir, { recursive: true });

      await fs.promises.writeFile(fullPath, content, 'utf-8');

      this.logger.info(`File created: ${filepath}`);

      await this.stagingOps.add(activeRepo, [filepath]);

      return { success: true, filepath };
    } catch (error) {
      this.logger.error('Error creating file', error);
      throw error;
    }
  }

  async read(activeRepo, filepath) {
    if (!activeRepo) {
      throw new Error('No active repository');
    }

    try {
      const fullPath = path.join(activeRepo, filepath);
      const content = await fs.promises.readFile(fullPath, 'utf-8');
      return { success: true, content, filepath };
    } catch (error) {
      this.logger.error('Error reading file', error);
      throw error;
    }
  }

  async update(activeRepo, filepath, content) {
    if (!activeRepo) {
      throw new Error('No active repository');
    }

    try {
      const fullPath = path.join(activeRepo, filepath);

      this.logger.info(`Updating file: ${filepath}`);

      await fs.promises.writeFile(fullPath, content, 'utf-8');

      this.logger.info(`File updated: ${filepath}`);

      await this.stagingOps.add(activeRepo, [filepath]);

      return { success: true, filepath };
    } catch (error) {
      this.logger.error('Error updating file', error);
      throw error;
    }
  }

  async delete(activeRepo, filepath) {
    if (!activeRepo) {
      throw new Error('No active repository');
    }

    try {
      const fullPath = path.join(activeRepo, filepath);

      this.logger.info(`Deleting file: ${filepath}`);

      await fs.promises.unlink(fullPath);

      this.logger.info(`File deleted: ${filepath}`);

      await git.remove({
        fs,
        dir: activeRepo,
        filepath,
      });

      return { success: true, filepath };
    } catch (error) {
      this.logger.error('Error deleting file', error);
      throw error;
    }
  }

  async list(activeRepo, directory = '.') {
    if (!activeRepo) {
      throw new Error('No active repository');
    }

    try {
      const fullPath = path.join(activeRepo, directory);
      const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });

      const files = [];
      const dirs = [];

      for (const entry of entries) {
        if (entry.name === '.git' || entry.name === 'node_modules') {
          continue;
        }

        if (entry.isDirectory()) {
          dirs.push({
            name: entry.name,
            type: 'directory',
            path: path.join(directory, entry.name),
          });
        } else {
          files.push({
            name: entry.name,
            type: 'file',
            path: path.join(directory, entry.name),
          });
        }
      }

      return { success: true, files, dirs };
    } catch (error) {
      this.logger.error('Error listing files', error);
      throw error;
    }
  }
}

module.exports = FileOperations;
