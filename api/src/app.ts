import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { router } from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';
import { logger } from './utils/logger.js';

export const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    })
  );
}

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.0.1',
    uptime: process.uptime(),
  });
});

// API documentation only available in development
if (process.env.NODE_ENV !== 'production') {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'AI Gateway API Documentation',
      swaggerOptions: {
        url: '/api-docs/swagger.json',
      },
    })
  );
}

app.use('/api', router);

app.use((req, res, _next) => {
  const availableRoutes: Record<string, string> = {
    health: '/health',
    api: '/api/*',
  };

  if (process.env.NODE_ENV !== 'production') {
    availableRoutes.docs = '/api-docs';
  }

  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes,
  });
});

app.use(errorHandler);
