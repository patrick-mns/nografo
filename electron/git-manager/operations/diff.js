const fs = require('fs');
const path = require('path');

class DiffOperations {
  constructor(logger, stagingOps) {
    this.logger = logger;
    this.stagingOps = stagingOps;
  }

  async apply(activeRepo, filepath, oldContent, newContent) {
    if (!activeRepo) {
      throw new Error('No active repository');
    }

    try {
      this.logger.info(`Applying diff to: ${filepath}`);

      const fullPath = path.join(activeRepo, filepath);

      let currentContent = '';
      try {
        currentContent = await fs.promises.readFile(fullPath, 'utf-8');
      } catch (error) {
        this.logger.debug('Creating new file');
      }

      if (currentContent && currentContent !== oldContent) {
        this.logger.warn("File content doesn't match expected. Applying anyway...");
      }

      await fs.promises.writeFile(fullPath, newContent, 'utf-8');

      this.logger.info('Diff applied successfully');

      await this.stagingOps.add(activeRepo, [filepath]);

      return { success: true, filepath };
    } catch (error) {
      this.logger.error('Error applying diff', error);
      throw error;
    }
  }
}

module.exports = DiffOperations;
