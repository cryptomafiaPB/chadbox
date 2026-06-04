import { z } from 'zod';

// Validates the files array being passed into the execution engine.
export const FileSchema = z.object({
    name: z.string().optional(),
    content: z.string(),
    encoding: z.enum(['utf8', 'base64', 'hex']).default('utf8'),
});

// payload POST /api/v1/execute route will accept.
export const ExecutionRequestSchema = z.object({
    language: z.string().min(1, 'Language is required'),
    version: z.string().min(1, 'Version is required').default('latest'),
    files: z.array(FileSchema).min(1, 'At least one file must be provided'),
    stdin: z.string().default(''),
    args: z.array(z.string()).default([]),

    // Resource Limits (with safe fallbacks)
    compile_timeout: z.number().max(13000).default(10000), // Max 13s - Default 10s
    compile_memory_limit: z.number().max(1024000).default(512000), // Max 1GB - Default 512MB

    run_timeout: z.number().max(10000).default(3000), // Max 10s - Default 3s
    run_memory_limit: z.number().max(512000).default(128000), // Max 512MB - Default 128MB
});

// Execution Result Schema
// Structure of the output after isolate finishes.
export const StageResultSchema = z.object({
    stdout: z.string(),
    stderr: z.string(),
    code: z.number().nullable(),
    signal: z.string().nullable(),
    time: z.number(), // Wall/CPU time in seconds
    memory: z.number(), // Memory used in KB
    output_limit_exceeded: z.boolean().default(false),
});

export const ExecutionResponseSchema = z.object({
    language: z.string(),
    version: z.string(),
    run: StageResultSchema,
    compile: StageResultSchema.optional(), // Only present for compiled languages like C++ or Rust
    status: z.enum(['OK', 'RE', 'SG', 'TO', 'XX']),
    /* OK = Success
    RE = Runtime Error
    SG = Died on Signal
    TO = Timeout
    XX = Internal Engine Error
  */
});

export type FilePayload = z.infer<typeof FileSchema>;
export type ExecutionRequest = z.infer<typeof ExecutionRequestSchema>;
export type StageResult = z.infer<typeof StageResultSchema>;
export type ExecutionResponse = z.infer<typeof ExecutionResponseSchema>;
