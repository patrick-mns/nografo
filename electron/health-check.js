const { app } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class HealthCheck {
  constructor() {
    this.checks = [];
    this.status = {
      healthy: true,
      checks: {},
      lastCheck: null,
    };
  }

  register(name, checkFn, critical = true) {
    this.checks.push({ name, checkFn, critical });
  }

  async run() {
    logger.info('[HealthCheck] Running health checks...');

    const results = {};
    let allHealthy = true;

    for (const check of this.checks) {
      try {
        const result = await check.checkFn();
        results[check.name] = {
          status: 'ok',
          ...result,
        };
        logger.debug(`[HealthCheck] ${check.name}: OK`);
      } catch (error) {
        results[check.name] = {
          status: 'error',
          error: error.message,
        };

        if (check.critical) {
          allHealthy = false;
        }

        logger.error(`[HealthCheck] ${check.name}: FAILED`, error);
      }
    }

    this.status = {
      healthy: allHealthy,
      checks: results,
      lastCheck: new Date().toISOString(),
    };

    return this.status;
  }

  getStatus() {
    return this.status;
  }
}

const healthCheck = new HealthCheck();

healthCheck.register('userData', async () => {
  const userDataPath = app.getPath('userData');
  await fs.access(userDataPath);
  const stats = await fs.stat(userDataPath);
  return {
    path: userDataPath,
    writable: true,
    size: stats.size,
  };
});

healthCheck.register('temp', async () => {
  const tempPath = app.getPath('temp');
  await fs.access(tempPath);
  return {
    path: tempPath,
    writable: true,
  };
});

healthCheck.register(
  'memory',
  async () => {
    const usage = process.memoryUsage();
    const maxMemory = 2048 * 1024 * 1024; 

    if (usage.heapUsed > maxMemory) {
      throw new Error(`Memory usage too high: ${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }

    return {
      heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      rss: `${(usage.rss / 1024 / 1024).toFixed(2)}MB`,
      external: `${(usage.external / 1024 / 1024).toFixed(2)}MB`,
    };
  },
  false
);

healthCheck.register(
  'electron',
  async () => {
    return {
      version: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
      v8: process.versions.v8,
    };
  },
  false
);

module.exports = healthCheck;
