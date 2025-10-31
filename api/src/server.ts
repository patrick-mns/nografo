import { config } from 'dotenv';
import { app } from './app.js';
import { logger } from './utils/logger.js';

config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  logger.info(`🚀 AI Gateway API v2 running on http://${HOST}:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`📚 API Documentation: http://${HOST}:${PORT}/api-docs`);
  }
  logger.info(`🏥 Health Check: http://${HOST}:${PORT}/health`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
