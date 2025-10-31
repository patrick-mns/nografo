module.exports = {
  security: {
    enableCORS: false,
    allowedOrigins: [],
    enableCSP: true,
    allowDevTools: false,
  },

  logging: {
    level: 'info',
    enableFileLogging: true,
    maxLogFiles: 7,
    maxLogSize: 10 * 1024 * 1024,
  },

  performance: {
    enableHardwareAcceleration: true,
    maxMemory: 2048,
    maxConcurrentIndexing: 4,
  },

  indexing: {
    autoIndexOnStartup: true,
    watchChanges: true,
    debounceMs: 1000,
    maxFileSize: 1024 * 1024,
    maxTotalDocuments: 50000,
  },

  git: {
    autoCommit: false,
    maxHistoryEntries: 100,
  },

  workspace: {
    maxGraphs: 100,
    maxGraphSize: 10 * 1024 * 1024,
    autoSave: true,
    autoSaveInterval: 30000,
  },

  updates: {
    autoDownload: true,
    autoInstall: false,
    checkInterval: 3600000,
  },

  errorReporting: {
    enabled: false,
    endpoint: null,
    includeSystemInfo: true,
  },
};
