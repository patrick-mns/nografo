const git = require('isomorphic-git');
const fs = require('fs');
const path = require('path');

class RepositoryOperations {
  constructor(logger) {
    this.logger = logger;
  }

  async init(workspacePath, activeRepo) {
    try {
      this.logger.info(`Initializing Git repository in ${workspacePath}...`);

      const gitDir = path.join(workspacePath, '.git');

      if (fs.existsSync(gitDir)) {
        this.logger.info('Git repository already exists');
        return {
          success: true,
          message: 'Repository already initialized',
          activeRepo: workspacePath,
        };
      }

      await git.init({
        fs,
        dir: workspacePath,
        defaultBranch: 'main',
      });

      const gitignore = `node_modules/
.env
.env.local
*.log
.DS_Store
dist/
build/
.vercel/
`;
      await fs.promises.writeFile(path.join(workspacePath, '.gitignore'), gitignore);

      this.logger.info('Git repository initialized successfully');

      return { success: true, message: 'Repository initialized', activeRepo: workspacePath };
    } catch (error) {
      this.logger.error('Error initializing repository', error);
      throw error;
    }
  }

  async getStatus(activeRepo) {
    if (!activeRepo) {
      throw new Error('No active repository');
    }

    try {
      const FILE = 0,
        WORKDIR = 2,
        STAGE = 3;

      const status = await git.statusMatrix({
        fs,
        dir: activeRepo,
      });

      const changes = {
        modified: [],
        added: [],
        deleted: [],
        untracked: [],
      };

      for (const [filepath, headStatus, worktreeStatus, stageStatus] of status) {
        if (filepath.startsWith('.git') || filepath.includes('node_modules')) {
          continue;
        }

        if (headStatus === 1 && worktreeStatus === 2 && stageStatus === 1) {
          changes.modified.push(filepath);
        } else if (headStatus === 0 && worktreeStatus === 2 && stageStatus === 0) {
          changes.untracked.push(filepath);
        } else if (headStatus === 1 && worktreeStatus === 0 && stageStatus === 1) {
          changes.deleted.push(filepath);
        } else if (headStatus === 0 && worktreeStatus === 2 && stageStatus === 2) {
          changes.added.push(filepath);
        }
      }

      return changes;
    } catch (error) {
      this.logger.error('Error getting status', error);
      throw error;
    }
  }

  async getCurrentBranch(activeRepo) {
    if (!activeRepo) {
      throw new Error('No active repository');
    }

    try {
      const branch = await git.currentBranch({
        fs,
        dir: activeRepo,
        fullname: false,
      });

      return branch || 'main';
    } catch (error) {
      this.logger.error('Error getting current branch', error);
      return null;
    }
  }

  async getLog(activeRepo, limit = 10) {
    if (!activeRepo) {
      throw new Error('No active repository');
    }

    try {
      const commits = await git.log({
        fs,
        dir: activeRepo,
        depth: limit,
      });

      return commits.map((commit) => ({
        sha: commit.oid,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: new Date(commit.commit.author.timestamp * 1000).toISOString(),
      }));
    } catch (error) {
      this.logger.error('Error getting log', error);
      throw error;
    }
  }
}

module.exports = RepositoryOperations;
