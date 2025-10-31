const { EventEmitter } = require('events');
const RepositoryOperations = require('./operations/repository');
const StagingOperations = require('./operations/staging');
const FileOperations = require('./operations/files');
const DiffOperations = require('./operations/diff');
const logger = require('../logger');

class GitManager extends EventEmitter {
  constructor(workspaceManager) {
    super();
    this.workspaceManager = workspaceManager;
    this.activeRepo = null;

    const gitLogger = logger.createNamespace('git-manager');
    this.repository = new RepositoryOperations(gitLogger);
    this.staging = new StagingOperations(gitLogger);
    this.files = new FileOperations(gitLogger, this.staging);
    this.diff = new DiffOperations(gitLogger, this.staging);

    this.workspaceManager.on('workspace:changed', (workspacePath) => {
      gitLogger.info('Workspace changed, updating active repo', { workspacePath });
      this.activeRepo = workspacePath;
    });

    this.workspaceManager.on('workspace:closed', () => {
      gitLogger.info('Workspace closed, clearing active repo');
      this.activeRepo = null;
    });

    const currentWorkspace = this.workspaceManager.getWorkspacePath();
    if (currentWorkspace) {
      gitLogger.info('Setting initial active repo', { workspacePath: currentWorkspace });
      this.activeRepo = currentWorkspace;
    }
  }

  async initRepo(workspacePath) {
    try {
      const result = await this.repository.init(workspacePath, this.activeRepo);
      this.activeRepo = result.activeRepo;

      await this.commitChanges('Initial commit', 'AI Assistant');

      return { success: true, message: result.message };
    } catch (error) {
      throw error;
    }
  }

  async addFiles(files = ['.']) {
    return await this.staging.add(this.activeRepo, files);
  }

  async commitChanges(message, author = 'AI Assistant') {
    return await this.staging.commit(this.activeRepo, message, author);
  }

  async getStatus() {
    return await this.repository.getStatus(this.activeRepo);
  }

  async getCurrentBranch() {
    return await this.repository.getCurrentBranch(this.activeRepo);
  }

  async getLog(limit = 10) {
    return await this.repository.getLog(this.activeRepo, limit);
  }

  async createFile(filepath, content) {
    return await this.files.create(this.activeRepo, filepath, content);
  }

  async readFile(filepath) {
    return await this.files.read(this.activeRepo, filepath);
  }

  async updateFile(filepath, content) {
    return await this.files.update(this.activeRepo, filepath, content);
  }

  async deleteFile(filepath) {
    return await this.files.delete(this.activeRepo, filepath);
  }

  async listFiles(directory = '.') {
    return await this.files.list(this.activeRepo, directory);
  }

  async applyDiff(filepath, oldContent, newContent) {
    return await this.diff.apply(this.activeRepo, filepath, oldContent, newContent);
  }
}

module.exports = GitManager;
