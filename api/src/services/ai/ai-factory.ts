import { IAIProvider, AIConfig } from './ai-provider.interface.js';
import { OpenAIService } from './openai.service.js';
import { AnthropicService } from './anthropic.service.js';
import { OllamaService } from './ollama.service.js';

export type AIProviderType = 'openai' | 'anthropic' | 'ollama';

export class AIFactory {
  static createProvider(provider: AIProviderType, config: AIConfig): IAIProvider {
    switch (provider) {
      case 'openai':
        return new OpenAIService(config);
      case 'anthropic':
        return new AnthropicService(config);
      case 'ollama':
        return new OllamaService(config);
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  }
}
