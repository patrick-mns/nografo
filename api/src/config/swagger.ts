import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Gateway API',
      version: '2.0.0',
      description: 'Modular AI Gateway with System Prompts - No Auth, No Database, Just AI',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.nografo.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Chat',
        description: 'Chat completion endpoints',
      },
      {
        name: 'Generate',
        description: 'Code generation endpoints',
      },
      {
        name: 'Commands',
        description: 'Special command endpoints',
      },
      {
        name: 'Enhance',
        description: 'Content enhancement endpoints',
      },
    ],
    components: {
      schemas: {
        AIProvider: {
          type: 'string',
          enum: ['openai', 'anthropic', 'ollama'],
          description: 'AI provider to use',
        },
        ChatRequest: {
          type: 'object',
          required: ['message', 'provider'],
          properties: {
            message: {
              type: 'string',
              description: 'User message',
              example: 'Explain recursion in simple terms',
            },
            provider: {
              $ref: '#/components/schemas/AIProvider',
            },
            apiKey: {
              type: 'string',
              description: 'API key for the provider (optional if set in env)',
              example: 'sk-...',
            },
            model: {
              type: 'string',
              description: 'Model to use',
              example: 'gpt-4',
            },
            baseUrl: {
              type: 'string',
              description: 'Base URL for Ollama',
              example: 'http://localhost:11434',
            },
            context: {
              type: 'object',
              description: 'Additional context for the prompt',
              properties: {
                hasRAG: {
                  type: 'boolean',
                  description: 'Whether RAG context is included',
                },
                ragStats: {
                  type: 'object',
                  properties: {
                    filesIncluded: {
                      type: 'number',
                    },
                    chunksUsed: {
                      type: 'number',
                    },
                  },
                },
              },
            },
          },
        },
        ChatResponse: {
          type: 'object',
          properties: {
            response: {
              type: 'string',
              description: 'AI response',
            },
            model: {
              type: 'string',
              description: 'Model used',
            },
            provider: {
              type: 'string',
              description: 'Provider used',
            },
            promptVersion: {
              type: 'string',
              description: 'Version of system prompt used',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
            },
            message: {
              type: 'string',
            },
            details: {
              type: 'object',
            },
          },
        },
      },
    },
  },
  apis: ['./src/endpoints/*.ts', './src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
