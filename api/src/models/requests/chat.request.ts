import { z } from 'zod';

export const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  provider: z.enum(['openai', 'anthropic', 'ollama']),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  baseUrl: z.string().url().optional(),
  context: z
    .object({
      hasRAG: z.boolean().optional(),
      ragStats: z
        .object({
          filesIncluded: z.number().optional(),
          chunksUsed: z.number().optional(),
          contextText: z.string().optional(),
        })
        .optional(),
      conversationHistory: z.array(MessageSchema).optional(),
      workspaceName: z.string().optional(),

      nodes: z.array(z.any()).optional(),
      edges: z.array(z.any()).optional(),

      repository_owner: z.string().optional(),
      repository_name: z.string().optional(),
      repository_branch: z.string().optional(),
    })
    .optional(),
  stream: z.boolean().optional().default(false),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatMessage = z.infer<typeof MessageSchema>;
