import { Request, Response } from 'express';
import { ChatRequest, ChatRequestSchema } from '../models/requests/chat.request.js';
import { AIFactory } from '../services/ai/ai-factory.js';
import { promptBuilder } from '../services/prompt/prompt-builder.service.js';
import { logger } from '../utils/logger.js';

/**
 * @openapi
 * /api/chat:
 *   post:
 *     summary: Chat completion with AI
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function chatEndpoint(req: Request, res: Response): Promise<void> {
  try {
    // Validate request
    const validatedData = ChatRequestSchema.parse(req.body) as ChatRequest;

    const { message, provider, apiKey, model, baseUrl, context, stream } = validatedData;

    // Log received context
    logger.info('Chat endpoint received request', {
      hasContext: !!context,
      hasNodes: !!context?.nodes,
      nodeCount: context?.nodes?.length || 0,
      hasRAG: context?.hasRAG,
      stream,
    });

    // Build system prompt
    const systemPrompt = await promptBuilder.buildChatPrompt(message, context);

    // Create AI provider
    const aiProvider = AIFactory.createProvider(provider, {
      apiKey,
      model,
      baseUrl,
    });

    // Build messages array with conversation history
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      // Include conversation history if available
      ...(context?.conversationHistory || []),
      // Add current user message
      { role: 'user' as const, content: message },
    ];

    logger.debug('Chat messages prepared', {
      provider,
      messageCount: messages.length,
      hasHistory: !!context?.conversationHistory?.length,
    });

    // Handle streaming
    if (stream && aiProvider.streamChat) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        for await (const chunk of aiProvider.streamChat(messages, { temperature: 0.7 })) {
          res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ chunk: '', done: true })}\n\n`);
        res.end();
      } catch (error) {
        logger.error('Streaming error', error);
        res.write(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`);
        res.end();
      }
      return;
    }

    // Regular chat
    const result = await aiProvider.chat(messages, { temperature: 0.7 });

    res.json({
      response: result.content,
      model: result.model,
      provider,
      usage: result.usage,
    });
  } catch (error: any) {
    logger.error('Chat endpoint error', error);
    res.status(500).json({
      error: 'Chat failed',
      message: error.message,
    });
  }
}
