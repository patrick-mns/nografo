const git = require('isomorphic-git');
const fs = require('fs');

class StagingOperations {
  constructor(logger) {
    this.logger = logger;
  }

  async add(activeRepo, files = ['.']) {
    if (!activeRepo) {
      throw new Error('No active repository');
    }

    try {
      this.logger.info('Adding files to staging...', { files });

      for (const file of files) {
        await git.add({
          fs,
          dir: activeRepo,
          filepath: file,
        });
        this.logger.debug(`Added: ${file}`);
      }

      return { success: true, message: `Added ${files.length} file(s)` };
    } catch (error) {
      this.logger.error('Error adding files', error);
      throw error;
    }
  }

  async commit(activeRepo, message, author = 'AI Assistant') {
    if (!activeRepo) {
      throw new Error('No active repository');
    }

    try {
      this.logger.info(`Creating commit: "${message}"`, { author });

      const sha = await git.commit({
        fs,
        dir: activeRepo,
        message,
        author: {
          name: author,
          email: 'ai@nografo.dev',
        },
      });

      this.logger.info(`Commit created: ${sha.substring(0, 7)}`);

      return {
        success: true,
        message: 'Commit created',
        sha,
      };
    } catch (error) {
      this.logger.error('Error creating commit', error);
      throw error;
    }
  }
}

module.exports = StagingOperations;
