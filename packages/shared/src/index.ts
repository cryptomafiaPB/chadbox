import { z } from 'zod';
import { config } from './config.js';

const reservedFileNames = new Set([
    'stdin.txt',
    'compile_stdout.txt',
    'compile_stderr.txt',
    'run_stdout.txt',
    'run_stderr.txt',
]);

export const SafeFileNameSchema = z
    .string()
    .min(1, 'Filename must not be empty')
    .max(255, 'Filename must not exceed 255 characters')
    .refine((name) => !name.includes('\0'), {
        message: 'Filename must not contain null bytes',
    })
    .refine((name) => !/^[/\\]/.test(name), {
        message: 'Filename must be a relative path, cannot start with / or \\',
    })
    .refine((name) => !/(^|[/\\])\.\.([/\\]|$)/.test(name), {
        message: 'Filename must not contain path traversal segments (..)',
    })
    .refine((name) => !/[/\\]/.test(name), {
        message: 'Filename must not contain directory separators',
    })
    .refine((name) => !reservedFileNames.has(name.toLowerCase()), {
        message: 'Filename is reserved for sandbox input or output',
    })
    .refine((name) => !/^[a-zA-Z]:/.test(name), {
        message: 'Filename must not contain Windows drive specifiers',
    });

// Validates the files array being passed into the execution engine.
export const FileSchema = z.object({
    name: SafeFileNameSchema.optional(),
    content: z.string(),
    encoding: z.enum(['utf8', 'base64', 'hex']).default('utf8'),
});

export function resolveExecutionFileName(
    language: string,
    file: { name?: string | undefined },
    index: number
): string {
    return file.name ?? (language === 'java' ? 'Main.java' : index === 0 ? 'main' : `file${index}`);
}

// payload POST /api/v1/execute route will accept.
export const ExecutionRequestSchema = z
    .object({
        language: z.string().min(1, 'Language is required'),
        version: z.string().min(1, 'Version is required').default('latest'),
        files: z.array(FileSchema).min(1, 'At least one file must be provided'),
        stdin: z.string().default(''),
        args: z.array(z.string()).default([]),

        compile_timeout: z
            .number()
            .positive()
            .max(config.ceilings.maxCompileTimeoutMs)
            .default(config.ceilings.defaultCompileTimeoutMs),
        compile_memory_limit: z
            .number()
            .positive()
            .max(config.ceilings.maxCompileMemoryKb)
            .default(config.ceilings.defaultCompileMemoryKb),

        run_timeout: z
            .number()
            .positive()
            .max(config.ceilings.maxRunTimeoutMs)
            .default(config.ceilings.defaultRunTimeoutMs),
        run_memory_limit: z
            .number()
            .positive()
            .max(config.ceilings.maxRunMemoryKb)
            .default(config.ceilings.defaultRunMemoryKb),
    })
    .superRefine((request, context) => {
        const names = request.files.map((file, index) =>
            resolveExecutionFileName(request.language, file, index)
        );
        const seen = new Set<string>();

        names.forEach((name, index) => {
            if (seen.has(name)) {
                context.addIssue({
                    code: 'custom',
                    message: `Duplicate filename '${name}'.`,
                    path: ['files', index, 'name'],
                });
            }
            seen.add(name);
        });
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

export * from './config.js';
