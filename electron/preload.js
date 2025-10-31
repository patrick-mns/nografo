const { contextBridge, ipcRenderer } = require('electron');

const VALID_IPC_CHANNELS = ['menu-new-graph'];
const APP_VERSION = process.env.npm_package_version || '1.0.0';

function isValidChannel(channel) {
  return VALID_IPC_CHANNELS.includes(channel);
}

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  getVersion: () => APP_VERSION,
  send: (channel, data) => {
    if (isValidChannel(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    if (isValidChannel(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  workspace: {
    select: () => ipcRenderer.invoke('workspace:select'),
    getCurrent: () => ipcRenderer.invoke('workspace:getCurrent'),
    close: () => ipcRenderer.invoke('workspace:close'),
    listGraphs: () => ipcRenderer.invoke('workspace:listGraphs'),
    saveGraph: (graphId, graphData) =>
      ipcRenderer.invoke('workspace:saveGraph', graphId, graphData),
    loadGraph: (graphId) => ipcRenderer.invoke('workspace:loadGraph', graphId),
    deleteGraph: (graphId) => ipcRenderer.invoke('workspace:deleteGraph', graphId),
    listFiles: (dirPath = '') => ipcRenderer.invoke('workspace:listFiles', dirPath),
    readFile: (filePath) => ipcRenderer.invoke('workspace:readFile', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('workspace:writeFile', filePath, content),
  },
});

contextBridge.exposeInMainWorld('electron', {
  git: {
    init: (path) => ipcRenderer.invoke('git:init', path),
    createFile: (filepath, content) => ipcRenderer.invoke('git:createFile', filepath, content),
    readFile: (filepath) => ipcRenderer.invoke('git:readFile', filepath),
    updateFile: (filepath, content) => ipcRenderer.invoke('git:updateFile', filepath, content),
    deleteFile: (filepath) => ipcRenderer.invoke('git:deleteFile', filepath),
    listFiles: (directory) => ipcRenderer.invoke('git:listFiles', directory),
    add: (files) => ipcRenderer.invoke('git:add', files),
    commit: (message, author) => ipcRenderer.invoke('git:commit', message, author),
    status: () => ipcRenderer.invoke('git:status'),
    currentBranch: () => ipcRenderer.invoke('git:currentBranch'),
    log: (limit) => ipcRenderer.invoke('git:log', limit),
    applyDiff: (filepath, oldContent, newContent) =>
      ipcRenderer.invoke('git:applyDiff', filepath, oldContent, newContent),
    onTerminalOutput: (callback) => {
      ipcRenderer.on('git:terminal-output', (event, data) => callback(data));
    },
  },
  ipcRenderer: {
    send: (channel, ...args) => {
      ipcRenderer.send(channel, ...args);
    },
    invoke: (channel, ...args) => {
      return ipcRenderer.invoke(channel, ...args);
    },
    on: (channel, listener) => {
      ipcRenderer.on(channel, listener);
    },
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    },
  },
  indexing: {
    initialize: (workspacePath, storagePath) =>
      ipcRenderer.invoke('indexing:initialize', workspacePath, storagePath),
    search: (query, k = 5) => ipcRenderer.invoke('indexing:search', query, k),
    stats: () => ipcRenderer.invoke('indexing:stats'),
    setEnabled: (enabled) => ipcRenderer.invoke('indexing:set-enabled', enabled),
    reindex: () => ipcRenderer.invoke('indexing:reindex'),
    clear: () => ipcRenderer.invoke('indexing:clear'),
  },
  system: {
    health: () => ipcRenderer.invoke('system:health'),
  },
});
