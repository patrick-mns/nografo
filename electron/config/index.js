const productionConfig = require('./production');
const developmentConfig = require('./development');

const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV === 'true';

const config = isDev ? developmentConfig : productionConfig;

const getConfig = () => {
  const finalConfig = { ...config };

  if (process.env.LOG_LEVEL) {
    finalConfig.logging.level = process.env.LOG_LEVEL;
  }

  if (process.env.AUTO_INDEX !== undefined) {
    finalConfig.indexing.autoIndexOnStartup = process.env.AUTO_INDEX === 'true';
  }

  return finalConfig;
};

module.exports = {
  isDev,
  config: getConfig(),
  getConfig,
};
