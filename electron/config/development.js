module.exports = {
  security: {
    enableCORS: true,
    allowedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
    enableCSP: false,
    allowDevTools: true,
  },

  logging: {
    level: 'debug',
    enableFileLogging: false,
    maxLogFiles: 3,
    maxLogSize: 50 * 1024 * 1024,
  },

  performance: {
    enableHardwareAcceleration: true,
    maxMemory: 4096,
    maxConcurrentIndexing: 2,
  },

  indexing: {
    autoIndexOnStartup: false,
    watchChanges: true,
    debounceMs: 2000,
    maxFileSize: 1024 * 1024,
    maxTotalDocuments: 10000,
  },

  git: {
    autoCommit: false,
    maxHistoryEntries: 50,
  },

  workspace: {
    maxGraphs: 1000,
    maxGraphSize: 50 * 1024 * 1024,
    autoSave: true,
    autoSaveInterval: 5000,
  },

  updates: {
    autoDownload: false,
    autoInstall: false,
    checkInterval: 86400000,
  },

  errorReporting: {
    enabled: false,
    endpoint: null,
    includeSystemInfo: true,
  },
};
