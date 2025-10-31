// Disable sharp for @xenova/transformers (we only use text embeddings, not image processing)
process.env.XENOVA_DISABLE_SHARP = '1';

const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const WorkspaceManager = require('./workspace-manager');
const { registerWorkspaceHandlers } = require('./workspace-manager/handlers');
const GitManager = require('./git-manager');
const { registerGitHandlers } = require('./git-manager/handlers');
const IndexingManager = require('./indexing-manager');
const { registerIndexingHandlers, shutdownIndexing } = require('./indexing-manager/handlers');
const logger = require('./logger');
const { isDev, config } = require('./config');
const healthCheck = require('./health-check');

let mainWindow;
let gitManager;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      sandbox: true,
      enableRemoteModule: false,
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 13, y: 10 },
    show: false,
  });

  if (isDev) {
    logger.info('Running in development mode');
    mainWindow.loadURL('http://localhost:3000');
    if (config.security.allowDevTools) {
      mainWindow.webContents.openDevTools();
    }
  } else {
    logger.info('Running in production mode');
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    logger.info('Loading index.html from:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMenu();

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    logger.error('Failed to load window', { errorCode, errorDescription });
  });
}

function createMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(async () => {
  const health = await healthCheck.run();
  if (!health.healthy) {
    logger.error('Health check failed', health);
  }

  const workspaceManager = new WorkspaceManager();
  await workspaceManager.initialize();
  registerWorkspaceHandlers(workspaceManager);
  
  gitManager = new GitManager(workspaceManager);
  registerGitHandlers(gitManager);
  
  gitManager.on('terminal-output', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('git:terminal-output', data);
    }
  });
  
  const indexingManager = new IndexingManager();
  registerIndexingHandlers(indexingManager);
  
  ipcMain.handle('system:health', async () => {
    return await healthCheck.run();
  });
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async (event) => {
  if (isQuitting) {
    return;
  }
  
  event.preventDefault();
  isQuitting = true;
  
  try {
    logger.info('Shutting down gracefully...');
    
    const shutdownTimeout = setTimeout(() => {
      logger.warn('Shutdown timeout, forcing quit');
      app.exit(0);
    }, 5000);
    
    await shutdownIndexing();
    logger.info('Indexing shutdown complete');
    
    if (gitManager) {
      gitManager.removeAllListeners();
      logger.info('Git manager cleaned up');
    }
    
    clearTimeout(shutdownTimeout);
    logger.info('Shutdown complete');
    app.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    app.exit(1);
  }
});

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

logger.info('Electron App Starting', {
  appPath: app.getAppPath(),
  userData: app.getPath('userData')
});
