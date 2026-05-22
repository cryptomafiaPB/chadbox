import { z } from 'zod';

// This is the "Industry Standard" contract for an RCE execution
export const ExecutionSchema = z.object({
  language: z.string(),
  code: z.string(),
  timeLimit: z.number().min(0.1).max(10).default(1),
  memoryLimit: z.number().min(1024).max(512000).default(128000), // KB
});

export type ExecutionPayload = z.infer<typeof ExecutionSchema>;