import { Router } from 'express';
import { chatEndpoint } from '../endpoints/chat.endpoint.js';
import { enhanceEndpoint } from '../endpoints/enhance.endpoint.js';
import {
  activeCommandEndpoint,
  addCommandEndpoint,
  createCommandEndpoint,
  createCommandStreamEndpoint,
} from '../endpoints/commands.endpoint.js';

export const router = Router();

/**
 * @openapi
 * /api:
 *   get:
 *     summary: API Information
 *     description: Returns basic API information and available endpoints
 *     responses:
 *       200:
 *         description: API information
 */
router.get('/', (_req, res) => {
  res.json({
    name: 'AI Gateway API',
    version: '0.0.1',
    description: 'Modular AI Gateway with System Prompts',
    endpoints: {
      chat: 'POST /api/chat',
      enhance: 'POST /api/enhance',
      commandActive: 'POST /api/commands/active',
      commandAdd: 'POST /api/commands/add',
      commandCreate: 'POST /api/commands/create',
      commandCreateStream: 'POST /api/commands/create/stream',
    },
    documentation: '/api-docs',
  });
});

// Chat endpoints
router.post('/chat', chatEndpoint);

// Enhancement endpoints
router.post('/enhance', enhanceEndpoint);

// Command endpoints
router.post('/commands/active', activeCommandEndpoint);
router.post('/commands/add', addCommandEndpoint);
router.post('/commands/create', createCommandEndpoint);
router.post('/commands/create/stream', createCommandStreamEndpoint);
