import { Request, Response } from 'express';
import { CommandRequest, CommandRequestSchema } from '../models/requests/command.request.js';
import { AIFactory } from '../services/ai/ai-factory.js';
import { promptBuilder } from '../services/prompt/prompt-builder.service.js';
import { logger } from '../utils/logger.js';

/**
 * @openapi
 * /api/commands/active:
 *   post:
 *     summary: Execute /active command
 *     tags: [Commands]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [command, provider]
 *     responses:
 *       200:
 *         description: Command result
 */
export async function activeCommandEndpoint(req: Request, res: Response): Promise<void> {
  try {
    logger.info('activeCommandEndpoint received request', { body: req.body });
    const validatedData = CommandRequestSchema.parse(req.body) as CommandRequest;
    logger.info('activeCommandEndpoint validation passed', { validatedData });
    const { provider, apiKey, model, baseUrl, context } = validatedData;

    const systemPrompt = await promptBuilder.buildCommandPrompt('active', context);
    logger.info('activeCommandEndpoint system prompt generated', {
      systemPrompt,
      contextNodes: context?.nodes?.length || 0,
      contextEdges: context?.edges?.length || 0,
    });

    const aiProvider = AIFactory.createProvider(provider, {
      apiKey,
      model,
      baseUrl,
    });

    const result = await aiProvider.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: validatedData.command },
      ],
      { temperature: 0.7 }
    );

    res.json({
      response: result.content,
      command: 'active',
      model: result.model,
      provider,
      usage: result.usage,
    });
  } catch (error: any) {
    logger.error('Active command error', error);
    res.status(500).json({
      error: 'Command failed',
      message: error.message,
    });
  }
}

/**
 * @openapi
 * /api/commands/add:
 *   post:
 *     summary: Execute /add command
 *     tags: [Commands]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [command, provider]
 *     responses:
 *       200:
 *         description: Command result
 */
export async function addCommandEndpoint(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = CommandRequestSchema.parse(req.body) as CommandRequest;
    const { provider, apiKey, model, baseUrl, context } = validatedData;

    const systemPrompt = await promptBuilder.buildCommandPrompt('add', context);

    const aiProvider = AIFactory.createProvider(provider, {
      apiKey,
      model,
      baseUrl,
    });

    const result = await aiProvider.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: validatedData.command },
      ],
      { temperature: 0.7 }
    );

    res.json({
      response: result.content,
      command: 'add',
      model: result.model,
      provider,
      usage: result.usage,
    });
  } catch (error: any) {
    logger.error('Add command error', error);
    res.status(500).json({
      error: 'Command failed',
      message: error.message,
    });
  }
}

/**
 * @openapi
 * /api/commands/create:
 *   post:
 *     summary: Execute /create command
 *     tags: [Commands]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [command, provider]
 *     responses:
 *       200:
 *         description: Command result
 */
export async function createCommandEndpoint(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = CommandRequestSchema.parse(req.body) as CommandRequest;
    const { provider, apiKey, model, baseUrl, context } = validatedData;

    const systemPrompt = await promptBuilder.buildCommandPrompt('create', context);

    const aiProvider = AIFactory.createProvider(provider, {
      apiKey,
      model,
      baseUrl,
    });

    const result = await aiProvider.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: validatedData.command },
      ],
      { temperature: 0.7 }
    );

    res.json({
      response: result.content,
      command: 'create',
      model: result.model,
      provider,
      usage: result.usage,
    });
  } catch (error: any) {
    logger.error('Create command error', error);
    res.status(500).json({
      error: 'Command failed',
      message: error.message,
    });
  }
}

/**
 * @openapi
 * /api/commands/create/stream:
 *   post:
 *     summary: Execute /create command with streaming
 *     tags: [Commands]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [command, provider]
 *     responses:
 *       200:
 *         description: Streamed command result
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 */
export async function createCommandStreamEndpoint(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = CommandRequestSchema.parse(req.body) as CommandRequest;
    const { provider, apiKey, model, baseUrl, context } = validatedData;

    logger.info('createCommandStreamEndpoint received request', {
      provider,
      model,
      hasContext: !!context,
    });

    const systemPrompt = await promptBuilder.buildCommandPrompt('create', context);

    const aiProvider = AIFactory.createProvider(provider, {
      apiKey,
      model,
      baseUrl,
    });

    if (!aiProvider.streamChat) {
      logger.warn('Provider does not support streaming, falling back to regular response');
      const result = await aiProvider.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: validatedData.command },
        ],
        { temperature: 0.7 }
      );

      res.json({
        response: result.content,
        command: 'create',
        model: result.model,
        provider,
        usage: result.usage,
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    logger.info('Starting stream for create command');

    try {
      for await (const chunk of aiProvider.streamChat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: validatedData.command },
        ],
        { temperature: 0.7 }
      )) {
        res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();

      logger.info('Stream completed successfully');
    } catch (streamError: any) {
      logger.error('Streaming error', streamError);
      res.write(`data: ${JSON.stringify({ error: streamError.message, done: true })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    logger.error('Create stream command error', error);

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Command failed',
        message: error.message,
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
      res.end();
    }
  }
}
