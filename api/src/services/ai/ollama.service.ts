import {
  IAIProvider,
  AIConfig,
  AIMessage,
  AICompletionOptions,
  AICompletionResult,
} from './ai-provider.interface.js';
import { logger } from '../../utils/logger.js';

export class OllamaService implements IAIProvider {
  private baseUrl: string;
  private model: string;

  constructor(config: AIConfig) {
    this.baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = config.model || 'llama2';

    logger.debug('Ollama service initialized', {
      baseUrl: this.baseUrl,
      model: this.model,
    });
  }

  async chat(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResult> {
    try {
      logger.debug('Ollama chat request', {
        model: this.model,
        messageCount: messages.length,
        roles: messages.map((m) => m.role),
      });

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = (await response.json()) as any;

      const result: AICompletionResult = {
        content: data.message?.content || '',
        model: this.model,
        usage: {
          promptTokens: data.prompt_eval_count,
          completionTokens: data.eval_count,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
      };

      logger.debug('Ollama chat response', {
        model: result.model,
        tokens: result.usage?.totalTokens,
      });

      return result;
    } catch (error: any) {
      logger.error('Ollama chat error', error);
      throw new Error(`Ollama API error: ${error.message}`);
    }
  }

  async *streamChat(messages: AIMessage[], options?: AICompletionOptions): AsyncIterable<string> {
    try {
      logger.debug('Ollama stream request', {
        model: this.model,
        messageCount: messages.length,
      });

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              yield data.message.content;
            }
          } catch (e) {}
        }
      }
    } catch (error: any) {
      logger.error('Ollama stream error', error);
      throw new Error(`Ollama streaming error: ${error.message}`);
    }
  }
}
