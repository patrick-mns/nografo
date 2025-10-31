const { ipcMain } = require('electron');
const {
  validateGraphId,
  validateFilePath,
  validateFileContent,
  ValidationError,
} = require('../utils/validation');

let workspaceManager = null;

function registerWorkspaceHandlers(manager) {
  workspaceManager = manager;

  ipcMain.handle('workspace:select', async () => {
    try {
      return await workspaceManager.selectWorkspace();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('workspace:getCurrent', async () => {
    try {
      return await workspaceManager.getCurrentWorkspace();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('workspace:close', () => {
    try {
      return workspaceManager.closeWorkspace();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('workspace:listGraphs', async () => {
    try {
      return await workspaceManager.listGraphs();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('workspace:saveGraph', async (event, graphId, graphData) => {
    try {
      validateGraphId(graphId);

      if (!graphData || typeof graphData !== 'object') {
        throw new ValidationError('Invalid graph data: must be an object');
      }

      return await workspaceManager.saveGraph(graphId, graphData);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('workspace:loadGraph', async (event, graphId) => {
    try {
      validateGraphId(graphId);
      return await workspaceManager.loadGraph(graphId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('workspace:deleteGraph', async (event, graphId) => {
    try {
      validateGraphId(graphId);
      return await workspaceManager.deleteGraph(graphId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('workspace:listFiles', async (event, dirPath) => {
    try {
      const workspacePath = workspaceManager.getWorkspacePath();
      const validatedPath = dirPath ? validateFilePath(dirPath, workspacePath) : '';
      return await workspaceManager.listFiles(validatedPath);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('workspace:readFile', async (event, filePath) => {
    try {
      const workspacePath = workspaceManager.getWorkspacePath();
      const validatedPath = validateFilePath(filePath, workspacePath);
      return await workspaceManager.readFile(validatedPath);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('workspace:writeFile', async (event, filePath, content) => {
    try {
      const workspacePath = workspaceManager.getWorkspacePath();
      const validatedPath = validateFilePath(filePath, workspacePath);
      const validatedContent = validateFileContent(content);
      return await workspaceManager.writeFile(validatedPath, validatedContent);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerWorkspaceHandlers,
};
