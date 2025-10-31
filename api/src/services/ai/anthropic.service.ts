import Anthropic from '@anthropic-ai/sdk';
import {
  IAIProvider,
  AIConfig,
  AIMessage,
  AICompletionOptions,
  AICompletionResult,
} from './ai-provider.interface.js';
import { logger } from '../../utils/logger.js';

export class AnthropicService implements IAIProvider {
  private client: Anthropic;
  private model: string;

  constructor(config: AIConfig) {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }

    this.client = new Anthropic({ apiKey });
    this.model = config.model || 'claude-3-opus-20240229';

    logger.debug('Anthropic service initialized', { model: this.model });
  }

  async chat(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResult> {
    try {
      logger.debug('Anthropic chat request', {
        model: this.model,
        messageCount: messages.length,
      });

      const systemMessage = messages.find((m) => m.role === 'system');
      const chatMessages = messages.filter((m) => m.role !== 'system');

      const anthropicMessages = chatMessages.map((m) => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content,
      }));

      logger.debug('Anthropic messages formatted', {
        originalCount: messages.length,
        systemPresent: !!systemMessage,
        chatMessageCount: anthropicMessages.length,
      });

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7,
        system: systemMessage?.content,
        messages: anthropicMessages,
      });

      const result: AICompletionResult = {
        content: response.content[0]?.type === 'text' ? response.content[0].text : '',
        model: response.model,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };

      logger.debug('Anthropic chat response', {
        model: result.model,
        tokens: result.usage?.totalTokens,
      });

      return result;
    } catch (error: any) {
      logger.error('Anthropic chat error', error);
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  async *streamChat(messages: AIMessage[], options?: AICompletionOptions): AsyncIterable<string> {
    try {
      logger.debug('Anthropic stream request', {
        model: this.model,
        messageCount: messages.length,
      });

      const systemMessage = messages.find((m) => m.role === 'system');
      const chatMessages = messages.filter((m) => m.role !== 'system');

      const anthropicMessages = chatMessages.map((m) => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content,
      }));

      const stream = await this.client.messages.stream({
        model: this.model,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7,
        system: systemMessage?.content,
        messages: anthropicMessages,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield chunk.delta.text;
        }
      }
    } catch (error: any) {
      logger.error('Anthropic stream error', error);
      throw new Error(`Anthropic streaming error: ${error.message}`);
    }
  }
}
