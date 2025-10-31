const { ipcMain } = require('electron');
const {
  validateFilePath,
  validateFileContent,
  validateCommitMessage,
  validateAuthorName,
  validatePositiveNumber,
} = require('../utils/validation');

function registerGitHandlers(gitManager) {
  ipcMain.handle('git:init', async (event, workspacePath) => {
    try {
      if (workspacePath) {
        validateFilePath(workspacePath);
      }
      return await gitManager.initRepo(workspacePath);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:add', async (event, files) => {
    try {
      if (!Array.isArray(files)) {
        throw new Error('Files must be an array');
      }
      return await gitManager.addFiles(files);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:commit', async (event, message, author) => {
    try {
      const validatedMessage = validateCommitMessage(message);
      const validatedAuthor = author ? validateAuthorName(author) : 'AI Assistant';
      return await gitManager.commitChanges(validatedMessage, validatedAuthor);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:status', async () => {
    try {
      return await gitManager.getStatus();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:currentBranch', async () => {
    try {
      return await gitManager.getCurrentBranch();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:log', async (event, limit) => {
    try {
      const validatedLimit = limit ? validatePositiveNumber(limit, 'limit', 1000) : 10;
      return await gitManager.getLog(validatedLimit);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:createFile', async (event, filepath, content) => {
    try {
      const validatedPath = validateFilePath(filepath);
      const validatedContent = validateFileContent(content);
      return await gitManager.createFile(validatedPath, validatedContent);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:readFile', async (event, filepath) => {
    try {
      const validatedPath = validateFilePath(filepath);
      return await gitManager.readFile(validatedPath);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:updateFile', async (event, filepath, content) => {
    try {
      const validatedPath = validateFilePath(filepath);
      const validatedContent = validateFileContent(content);
      return await gitManager.updateFile(validatedPath, validatedContent);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:deleteFile', async (event, filepath) => {
    try {
      const validatedPath = validateFilePath(filepath);
      return await gitManager.deleteFile(validatedPath);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:listFiles', async (event, directory) => {
    try {
      const validatedDir = directory ? validateFilePath(directory) : '.';
      return await gitManager.listFiles(validatedDir);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:applyDiff', async (event, filepath, oldContent, newContent) => {
    try {
      const validatedPath = validateFilePath(filepath);
      const validatedOldContent = validateFileContent(oldContent);
      const validatedNewContent = validateFileContent(newContent);
      return await gitManager.applyDiff(validatedPath, validatedOldContent, validatedNewContent);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerGitHandlers };
