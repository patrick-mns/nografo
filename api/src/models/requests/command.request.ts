import { z } from 'zod';

export const CommandRequestSchema = z.object({
  command: z.string().min(1, 'Command is required'),
  args: z.array(z.string()).optional(),
  provider: z.enum(['openai', 'anthropic', 'ollama']),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  baseUrl: z.string().url().optional(),
  context: z
    .object({
      currentFile: z.string().optional(),
      selection: z.string().optional(),
      workspacePath: z.string().optional(),
      nodes: z
        .array(
          z.object({
            id: z.string(),
            label: z.string().optional(),
            content: z.string().optional(),
            active: z.boolean().optional(),
          })
        )
        .optional(),
      edges: z
        .array(
          z.object({
            source: z.string(),
            target: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
});

export type CommandRequest = z.infer<typeof CommandRequestSchema>;
