import { Request, Response } from 'express';
import { EnhanceRequest, EnhanceRequestSchema } from '../models/requests/enhance.request.js';
import { AIFactory } from '../services/ai/ai-factory.js';
import { promptBuilder } from '../services/prompt/prompt-builder.service.js';
import { logger } from '../utils/logger.js';

/**
 * @openapi
 * /api/enhance:
 *   post:
 *     summary: Enhance content with AI
 *     tags: [Enhance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content, request, provider]
 *             properties:
 *               content:
 *                 type: string
 *               request:
 *                 type: string
 *               provider:
 *                 $ref: '#/components/schemas/AIProvider'
 *               apiKey:
 *                 type: string
 *               model:
 *                 type: string
 *               baseUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Enhanced content
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
export async function enhanceEndpoint(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = EnhanceRequestSchema.parse(req.body) as EnhanceRequest;

    const { content, request, provider, apiKey, model, baseUrl, context } = validatedData;

    // Build system prompt
    const systemPrompt = await promptBuilder.buildEnhancePrompt(content, request, context);

    // Create AI provider
    const aiProvider = AIFactory.createProvider(provider, {
      apiKey,
      model,
      baseUrl,
    });

    // Get enhancement
    const result = await aiProvider.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Content: ${content}\n\nEnhancement request: ${request}` },
      ],
      { temperature: 0.7 }
    );

    res.json({
      enhanced: result.content,
      model: result.model,
      provider,
      usage: result.usage,
    });
  } catch (error: any) {
    logger.error('Enhance endpoint error', error);
    res.status(500).json({
      error: 'Enhancement failed',
      message: error.message,
    });
  }
}
