const { EventEmitter } = require('events');
const WorkspaceOperations = require('./operations/workspace');
const GraphsOperations = require('./operations/graphs');
const FilesOperations = require('./operations/files');
const logger = require('../logger');

class WorkspaceManager extends EventEmitter {
  constructor() {
    super();
    this.currentWorkspace = null;

    const workspaceLogger = logger.createNamespace('workspace-manager');
    this.workspace = new WorkspaceOperations(workspaceLogger);
    this.graphs = new GraphsOperations(workspaceLogger);
    this.files = new FilesOperations(workspaceLogger);
  }

  async selectWorkspace() {
    const result = await this.workspace.selectWorkspaceFolder();

    if (result && result.success) {
      this.currentWorkspace = result.path;
      await this.workspace.saveLastWorkspace(this.currentWorkspace);
      this.emit('workspace:changed', this.currentWorkspace);
    }

    return result;
  }

  async getCurrentWorkspace() {
    if (!this.currentWorkspace) {
      return null;
    }

    const info = await this.workspace.getWorkspaceInfo(this.currentWorkspace);

    if (info) {
      const graphs = await this.graphs.listGraphs(this.currentWorkspace);
      info.graphCount = graphs.length;
    }

    return info;
  }

  closeWorkspace() {
    this.currentWorkspace = null;
    this.emit('workspace:closed');
    return true;
  }

  async listGraphs() {
    return await this.graphs.listGraphs(this.currentWorkspace);
  }

  async saveGraph(graphId, graphData) {
    return await this.graphs.saveGraph(this.currentWorkspace, graphId, graphData);
  }

  async loadGraph(graphId) {
    return await this.graphs.loadGraph(this.currentWorkspace, graphId);
  }

  async deleteGraph(graphId) {
    return await this.graphs.deleteGraph(this.currentWorkspace, graphId);
  }

  async listFiles(dirPath) {
    return await this.files.listFiles(this.currentWorkspace, dirPath);
  }

  async readFile(filePath) {
    return await this.files.readFile(this.currentWorkspace, filePath);
  }

  async writeFile(filePath, content) {
    return await this.files.writeFile(this.currentWorkspace, filePath, content);
  }

  async initialize() {
    this.currentWorkspace = await this.workspace.loadLastWorkspace();
    return this;
  }

  getWorkspacePath() {
    return this.currentWorkspace;
  }
}

module.exports = WorkspaceManager;
