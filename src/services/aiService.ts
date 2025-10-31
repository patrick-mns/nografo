import { apiClient } from '../lib/api';
import { ragService } from './ragService';
import type { RAGContext } from './ragService';

export interface AIEnhanceRequest {
  title: string;
  content: string;
  context?: string;
  task: 'improve' | 'expand' | 'summarize' | 'clarify';
  provider: 'openai' | 'anthropic' | 'ollama';
  api_key: string;
}

export interface AIEnhanceResponse {
  enhanced_title: string;
  enhanced_content: string;
  suggestions?: string[] | null;
  provider_used: 'openai' | 'anthropic' | 'ollama';
}

export interface AIChatRequest {
  message: string;
  context: {
    nodes: Array<{
      id: string;
      label: string;
      content: string;
      active: boolean;
    }>;
    edges: Array<{
      source: string;
      target: string;
    }>;
  };
  provider: 'openai' | 'anthropic' | 'ollama';
  api_key: string;
}

export interface AIChatResponse {
  response: string;
  actions?: Array<{
    type: 'newGraph' | 'addNodes' | 'updateNodes';
    data: {
      nodes?: any[];
      edges?: any[];
    };
  }>;
  provider_used: 'openai' | 'anthropic' | 'ollama';
}

export interface AIGenerateGraphRequest {
  prompt: string;
  existing_context?: {
    nodes: any[];
    edges: any[];
  } | null;
  mode: 'create' | 'extend';
  provider: 'openai' | 'anthropic' | 'ollama';
  api_key: string;
}

export interface AIGenerateGraphResponse {
  graph: {
    nodes: Array<{
      type: string;
      position: { x: number; y: number };
      data: {
        label: string;
        content: string;
        active: boolean;
      };
      id: string;
    }>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
      id: string;
    }>;
  };
  provider_used: 'openai' | 'anthropic' | 'ollama';
}

export interface AISuggestConnectionsRequest {
  nodes: Array<{
    id: string;
    label: string;
    content: string;
  }>;
  existing_edges: Array<{
    source: string;
    target: string;
  }>;
  provider: 'openai' | 'anthropic' | 'ollama';
  api_key: string;
}

export interface AISuggestConnectionsResponse {
  suggestions: Array<{
    source: string;
    target: string;
    reasoning: string;
    confidence: number;
  }>;
  provider_used: 'openai' | 'anthropic' | 'ollama';
}

export class AIService {
  async activeCommand(argument: string, context: any, config: any): Promise<string> {
    const requestBody = {
      command: argument,
      provider: config.selectedProvider || 'openai',
      apiKey:
        config.selectedProvider === 'anthropic' ? config.anthropicApiKey : config.openaiApiKey,
      model: config.selectedProvider === 'anthropic' ? config.anthropicModel : config.openaiModel,
      baseUrl: config.selectedProvider === 'ollama' ? config.ollamaBaseUrl : undefined,
      context,
    };
    console.log('[aiService] activeCommand request:', JSON.stringify(requestBody, null, 2));

    try {
      const response = await apiClient.post<{ response: string }>('/commands/active', requestBody);
      return response.response;
    } catch (error: any) {
      console.error('[aiService] activeCommand error:', error);
      throw error;
    }
  }

  async addCommand(argument: string, context: any, config: any): Promise<string> {
    const response = await apiClient.post<{ response: string }>('/commands/add', {
      command: argument,
      provider: config.selectedProvider || 'openai',
      apiKey:
        config.selectedProvider === 'anthropic' ? config.anthropicApiKey : config.openaiApiKey,
      model: config.selectedProvider === 'anthropic' ? config.anthropicModel : config.openaiModel,
      baseUrl: config.selectedProvider === 'ollama' ? config.ollamaBaseUrl : undefined,
      context,
    });
    return response.response;
  }

  async createCommand(argument: string, config: any): Promise<string> {
    const response = await apiClient.post<{ response: string }>('/commands/create', {
      command: argument,
      provider: config.selectedProvider || 'openai',
      apiKey:
        config.selectedProvider === 'anthropic' ? config.anthropicApiKey : config.openaiApiKey,
      model: config.selectedProvider === 'anthropic' ? config.anthropicModel : config.openaiModel,
      baseUrl: config.selectedProvider === 'ollama' ? config.ollamaBaseUrl : undefined,
    });
    return response.response;
  }

  async createCommandStream(
    argument: string,
    config: any,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const requestBody = {
      command: argument,
      provider: config.selectedProvider || 'openai',
      apiKey:
        config.selectedProvider === 'anthropic' ? config.anthropicApiKey : config.openaiApiKey,
      model: config.selectedProvider === 'anthropic' ? config.anthropicModel : config.openaiModel,
      baseUrl: config.selectedProvider === 'ollama' ? config.ollamaBaseUrl : undefined,
    };

    const response = await fetch(`${apiClient.getBaseURL()}/commands/create/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;

      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        if (response.status === 405) {
          errorMessage = 'Method not allowed. Please check your API configuration.';
        } else if (response.status === 401) {
          errorMessage = 'Unauthorized. Please check your API credentials.';
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Please check your API permissions.';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      }

      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) {
            continue;
          }

          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            try {
              const parsed = JSON.parse(data);

              if (parsed.error) {
                throw new Error(parsed.error);
              }

              if (parsed.done) {
                return;
              }

              if (parsed.chunk) {
                onChunk(parsed.chunk);
              }
            } catch (e) {
              if (e instanceof Error && e.message && !e.message.includes('JSON')) {
                throw e;
              }
              console.error('Error parsing SSE data:', e, 'Data:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async regularCommand(command: string, context: any, config: any): Promise<string> {
    const response = await apiClient.post<{ response: string }>('/chat', {
      message: command,
      provider: config.selectedProvider || 'openai',
      apiKey:
        config.selectedProvider === 'anthropic' ? config.anthropicApiKey : config.openaiApiKey,
      model: config.selectedProvider === 'anthropic' ? config.anthropicModel : config.openaiModel,
      baseUrl: config.selectedProvider === 'ollama' ? config.ollamaBaseUrl : undefined,
      stream: false,
      context,
    });
    return response.response;
  }

  async regularCommandStream(
    command: string,
    context: any,
    conversationHistory: Array<{ type: string; content: string; timestamp: Date }>,
    config: any,
    onChunk: (chunk: string) => void,
    onRagContext?: (ragContext: RAGContext | null) => void,
    signal?: AbortSignal
  ): Promise<void> {
    let ragContext: RAGContext | null = null;
    if (ragService.isAvailable()) {
      try {
        ragContext = await ragService.getContext(command, {
          k: 8,
          minScore: 0.65,
          maxTokens: 4000,
          format: 'detailed',
        });
      } catch (error) {
        console.error('[aiService] ❌ RAG: Error getting context:', error);
        ragContext = null;
      }

      onRagContext?.(ragContext);
    } else {
      onRagContext?.(null);
    }

    const apiConversationHistory = conversationHistory.map((msg) => ({
      role: (msg.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.content,
    }));

    const requestBody = {
      message: command,
      provider: config.selectedProvider || 'openai',
      apiKey:
        config.selectedProvider === 'anthropic' ? config.anthropicApiKey : config.openaiApiKey,
      model: config.selectedProvider === 'anthropic' ? config.anthropicModel : config.openaiModel,
      baseUrl: config.selectedProvider === 'ollama' ? config.ollamaBaseUrl : undefined,
      stream: true,
      context: {
        ...context,
        hasRAG: !!ragContext,
        ragStats: ragContext
          ? {
              filesIncluded: ragContext.stats?.filesIncluded?.length || 0,
              chunksUsed: ragContext.stats?.chunksUsed || 0,
              contextText: ragContext.contextText,
            }
          : undefined,
        conversationHistory: apiConversationHistory,
      },
    };

    console.log('[aiService] 📤 Request context:', {
      hasNodes: !!context?.nodes,
      nodeCount: context?.nodes?.length || 0,
      hasRAG: !!ragContext,
      hasHistory: conversationHistory.length > 0,
    });
    console.log('[aiService] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${apiClient.getBaseURL()}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;

      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        if (response.status === 405) {
          errorMessage = 'Method not allowed. Please check your API configuration.';
        } else if (response.status === 401) {
          errorMessage = 'Unauthorized. Please check your API credentials.';
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Please check your API permissions.';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      }

      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) {
            continue;
          }

          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            try {
              const parsed = JSON.parse(data);

              if (parsed.error) {
                throw new Error(parsed.error);
              }

              if (parsed.done) {
                return;
              }

              if (parsed.chunk) {
                onChunk(parsed.chunk);
              }
            } catch (e) {
              if (e instanceof Error && e.message && !e.message.includes('JSON')) {
                throw e;
              }
              console.error('Error parsing SSE data:', e, 'Data:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async enhanceContent(request: AIEnhanceRequest): Promise<AIEnhanceResponse> {
    const { provider, api_key, content, task } = request;

    const response = await apiClient.post<{ enhanced: string }>('/enhance', {
      content,
      request: task,
      provider,
      apiKey: api_key,
    });

    return {
      enhanced_title: request.title,
      enhanced_content: response.enhanced,
      provider_used: provider,
    };
  }

  async suggestConnections(
    request: AISuggestConnectionsRequest
  ): Promise<AISuggestConnectionsResponse> {
    return {
      suggestions: [],
      provider_used: request.provider,
    };
  }
}

export const aiService = new AIService();
