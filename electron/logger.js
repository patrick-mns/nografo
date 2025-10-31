const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.logLevel = this.isDevelopment ? 'debug' : 'info';
    this.logFile = null;
    this.enableFileLogging = false;

    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    this.icons = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    };
  }

  initialize() {
    if (this.enableFileLogging && app) {
      try {
        const logsDir = path.join(app.getPath('userData'), 'logs');
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().split('T')[0];
        this.logFile = path.join(logsDir, `app-${timestamp}.log`);

        this.info('Logger initialized', { logFile: this.logFile });
      } catch (error) {
        console.error('Failed to initialize file logging:', error);
      }
    }
  }

  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.logLevel = level;
    }
  }

  setFileLogging(enabled) {
    this.enableFileLogging = enabled;
    if (enabled && !this.logFile) {
      this.initialize();
    }
  }

  shouldLog(level) {
    return this.levels[level] >= this.levels[this.logLevel];
  }

  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const icon = this.icons[level] || '';
    const prefix = `[${timestamp}] ${icon} [${level.toUpperCase()}]`;

    let formattedMessage = `${prefix} ${message}`;

    if (data !== undefined) {
      if (typeof data === 'object') {
        formattedMessage += '\n' + JSON.stringify(data, null, 2);
      } else {
        formattedMessage += ' ' + String(data);
      }
    }

    return formattedMessage;
  }

  log(level, message, data) {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, data);

    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';

      if (data !== undefined) {
        console[consoleMethod](`${this.icons[level]} [${level.toUpperCase()}]`, message, data);
      } else {
        console[consoleMethod](`${this.icons[level]} [${level.toUpperCase()}]`, message);
      }
    } else {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](formattedMessage);
    }

    if (this.enableFileLogging && this.logFile) {
      try {
        fs.appendFileSync(this.logFile, formattedMessage + '\n');
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    }
  }

  debug(message, data) {
    this.log('debug', message, data);
  }

  info(message, data) {
    this.log('info', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  createNamespace(namespace) {
    return {
      debug: (message, data) => this.debug(`[${namespace}] ${message}`, data),
      info: (message, data) => this.info(`[${namespace}] ${message}`, data),
      warn: (message, data) => this.warn(`[${namespace}] ${message}`, data),
      error: (message, data) => this.error(`[${namespace}] ${message}`, data),
    };
  }
}

const logger = new Logger();
module.exports = logger;
