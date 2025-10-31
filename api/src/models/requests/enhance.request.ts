import { z } from 'zod';

export const EnhanceRequestSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  request: z.string().min(1, 'Enhancement request is required'),
  provider: z.enum(['openai', 'anthropic', 'ollama']),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  baseUrl: z.string().url().optional(),
  context: z.object({}).optional(),
});

export type EnhanceRequest = z.infer<typeof EnhanceRequestSchema>;
