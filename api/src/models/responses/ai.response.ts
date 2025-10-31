export interface AIResponse {
  response: string;
  model: string;
  provider: string;
  promptVersion?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface StreamingAIResponse {
  chunk: string;
  done: boolean;
}
