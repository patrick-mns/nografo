import OpenAI from 'openai';
import {
  IAIProvider,
  AIConfig,
  AIMessage,
  AICompletionOptions,
  AICompletionResult,
} from './ai-provider.interface.js';
import { logger } from '../../utils/logger.js';

export class OpenAIService implements IAIProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: AIConfig) {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({ apiKey });
    this.model = config.model || 'gpt-4-turbo-preview';

    logger.debug('OpenAI service initialized', { model: this.model });
  }

  async chat(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResult> {
    try {
      logger.debug('OpenAI chat request', {
        model: this.model,
        messageCount: messages.length,
        roles: messages.map((m) => m.role),
      });

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: messages as any,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
      });

      const result: AICompletionResult = {
        content: completion.choices[0]?.message?.content || '',
        model: completion.model,
        usage: {
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
          totalTokens: completion.usage?.total_tokens,
        },
      };

      logger.debug('OpenAI chat response', {
        model: result.model,
        tokens: result.usage?.totalTokens,
      });

      return result;
    } catch (error: any) {
      logger.error('OpenAI chat error', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async *streamChat(messages: AIMessage[], options?: AICompletionOptions): AsyncIterable<string> {
    try {
      logger.debug('OpenAI stream request', {
        model: this.model,
        messageCount: messages.length,
      });

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: messages as any,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error: any) {
      logger.error('OpenAI stream error', error);
      throw new Error(`OpenAI streaming error: ${error.message}`);
    }
  }
}
