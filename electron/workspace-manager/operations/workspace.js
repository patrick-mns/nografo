const { dialog, app } = require('electron');
const fs = require('fs').promises;
const path = require('path');

class WorkspaceOperations {
  constructor(logger) {
    this.logger = logger;
  }

  async validateWorkspace(workspacePath) {
    try {
      const nografoPath = path.join(workspacePath, '.nografo');
      const stats = await fs.stat(nografoPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  async initializeWorkspace(workspacePath) {
    const nografoPath = path.join(workspacePath, '.nografo');

    try {
      
      await fs.mkdir(nografoPath, { recursive: true });
      await fs.mkdir(path.join(nografoPath, 'graphs'), { recursive: true });

      const workspaceConfig = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        name: path.basename(workspacePath),
        settings: {
          autoSave: true,
        },
      };

      await fs.writeFile(
        path.join(nografoPath, 'workspace.json'),
        JSON.stringify(workspaceConfig, null, 2)
      );

      const exampleGraph = {
        id: 'welcome-graph',
        name: 'Welcome Graph',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: [
          {
            id: 'node-1',
            type: 'contextNode',
            position: { x: 250, y: 100, z: 0 },
            data: {
              label: 'Welcome!',
              content: 'This is an example graph. You can edit it or create new graphs.',
              active: false,
            },
          },
          {
            id: 'node-2',
            type: 'contextNode',
            position: { x: 250, y: 250, z: 0 },
            data: {
              label: 'Start here',
              content: 'Click the + button to add new nodes.',
              active: true,
            },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            type: 'bottom',
          },
        ],
      };

      await fs.writeFile(
        path.join(nografoPath, 'graphs', 'welcome-graph.json'),
        JSON.stringify(exampleGraph, null, 2)
      );

      this.logger.info('Workspace initialized successfully', { path: workspacePath });
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize workspace', {
        error: error.message,
        path: workspacePath,
      });
      throw error;
    }
  }

  async selectWorkspaceFolder() {
    this.logger.debug('Opening workspace folder selection dialog');
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select workspace folder',
      buttonLabel: 'Select',
      message: 'Choose where your graphs will be saved',
    });

    if (result.canceled || result.filePaths.length === 0) {
      this.logger.debug('Workspace selection canceled by user');
      return null;
    }

    const selectedPath = result.filePaths[0];
    this.logger.debug('Path selected by user', { path: selectedPath });

    const isValid = await this.validateWorkspace(selectedPath);

    if (!isValid) {
      this.logger.info('Initializing new workspace at selected path');
      await this.initializeWorkspace(selectedPath);
    } else {
      this.logger.info('Valid workspace found at selected path');
    }

    this.logger.info('Workspace selection complete', {
      path: selectedPath,
      name: path.basename(selectedPath),
    });

    return {
      success: true,
      path: selectedPath,
      name: path.basename(selectedPath),
    };
  }

  async getWorkspaceInfo(workspacePath) {
    if (!workspacePath) {
      return null;
    }

    const configPath = path.join(workspacePath, '.nografo', 'workspace.json');

    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      return {
        path: workspacePath,
        name: config.name || path.basename(workspacePath),
        createdAt: config.createdAt,
        settings: config.settings,
      };
    } catch (error) {
      return {
        path: workspacePath,
        name: path.basename(workspacePath),
        graphCount: 0,
      };
    }
  }

  async loadLastWorkspace() {
    const workspaceConfigPath = path.join(app.getPath('userData'), 'workspace-config.json');

    try {
      const data = await fs.readFile(workspaceConfigPath, 'utf-8');
      const config = JSON.parse(data);

      if (config.lastWorkspace && (await this.validateWorkspace(config.lastWorkspace))) {
        this.logger.info('Successfully loaded last workspace', { path: config.lastWorkspace });
        return config.lastWorkspace;
      }

      this.logger.debug('Last workspace path found but invalid');
    } catch (error) {
      this.logger.debug('No previous workspace configuration found');
    }

    return null;
  }

  async saveLastWorkspace(workspacePath) {
    const workspaceConfigPath = path.join(app.getPath('userData'), 'workspace-config.json');

    try {
      await fs.writeFile(
        workspaceConfigPath,
        JSON.stringify({ lastWorkspace: workspacePath }, null, 2)
      );
      this.logger.debug('Last workspace path saved', { path: workspacePath });
    } catch (error) {
      this.logger.error('Failed to save workspace configuration', { error: error.message });
    }
  }
}

module.exports = WorkspaceOperations;
