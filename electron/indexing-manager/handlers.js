const { ipcMain } = require('electron');
const logger = require('../logger');
const {
  validateFilePath,
  validateSearchQuery,
  validatePositiveNumber,
} = require('../utils/validation');

const log = logger.createNamespace('IndexingHandlers');

let indexingManager = null;

function registerIndexingHandlers(manager) {
  indexingManager = manager;

  ipcMain.handle('indexing:initialize', async (event, workspacePath, storagePath) => {
    try {
      validateFilePath(workspacePath);
      validateFilePath(storagePath);
      await indexingManager.initialize(workspacePath, storagePath);
      return { success: true };
    } catch (error) {
      log.error(' Initialize failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('indexing:search', async (event, query, k = 5) => {
    try {
      const validatedQuery = validateSearchQuery(query);
      const validatedK = validatePositiveNumber(k, 'k', 100);
      const results = await indexingManager.search(validatedQuery, validatedK);
      return { success: true, results };
    } catch (error) {
      log.error(' Search failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('indexing:stats', async () => {
    try {
      const stats = indexingManager.getStats();
      return { success: true, stats };
    } catch (error) {
      log.error(' Stats failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('indexing:set-enabled', async (event, enabled) => {
    try {
      if (typeof enabled !== 'boolean') {
        throw new Error('Enabled must be a boolean');
      }
      indexingManager.setEnabled(enabled);
      return { success: true };
    } catch (error) {
      log.error(' Set enabled failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('indexing:reindex', async () => {
    try {
      
      indexingManager
        .clearIndex()
        .then(() => {
          return indexingManager.indexWorkspace();
        })
        .then(() => {
          return indexingManager.saveIndex();
        })
        .catch((error) => {
          log.error(' Background reindex failed:', error);
        });
      return { success: true };
    } catch (error) {
      log.error(' Reindex failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('indexing:clear', async () => {
    try {
      await indexingManager.clearIndex();
      return { success: true };
    } catch (error) {
      log.error(' Clear failed:', error);
      return { success: false, error: error.message };
    }
  });
}

async function shutdownIndexing() {
  if (indexingManager) {
    await indexingManager.shutdown();
    indexingManager = null;
  }
}

module.exports = {
  registerIndexingHandlers,
  shutdownIndexing,
};
