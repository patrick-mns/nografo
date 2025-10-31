export interface AIConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AICompletionResult {
  content: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface IAIProvider {
  chat(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResult>;

  streamChat?(messages: AIMessage[], options?: AICompletionOptions): AsyncIterable<string>;
}
