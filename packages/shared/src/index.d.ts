import { z } from 'zod';
export declare const FileSchema: z.ZodObject<
  {
    name: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
    encoding: z.ZodDefault<
      z.ZodEnum<{
        utf8: 'utf8';
        base64: 'base64';
        hex: 'hex';
      }>
    >;
  },
  z.core.$strip
>;
export declare const ExecutionRequestSchema: z.ZodObject<
  {
    language: z.ZodString;
    version: z.ZodString;
    files: z.ZodArray<
      z.ZodObject<
        {
          name: z.ZodOptional<z.ZodString>;
          content: z.ZodString;
          encoding: z.ZodDefault<
            z.ZodEnum<{
              utf8: 'utf8';
              base64: 'base64';
              hex: 'hex';
            }>
          >;
        },
        z.core.$strip
      >
    >;
    stdin: z.ZodDefault<z.ZodString>;
    args: z.ZodDefault<z.ZodArray<z.ZodString>>;
    compile_timeout: z.ZodDefault<z.ZodNumber>;
    run_timeout: z.ZodDefault<z.ZodNumber>;
    compile_memory_limit: z.ZodDefault<z.ZodNumber>;
    run_memory_limit: z.ZodDefault<z.ZodNumber>;
  },
  z.core.$strip
>;
export declare const StageResultSchema: z.ZodObject<
  {
    stdout: z.ZodString;
    stderr: z.ZodString;
    code: z.ZodNullable<z.ZodNumber>;
    signal: z.ZodNullable<z.ZodString>;
    time: z.ZodNumber;
    memory: z.ZodNumber;
    output_limit_exceeded: z.ZodDefault<z.ZodBoolean>;
  },
  z.core.$strip
>;
export declare const ExecutionResponseSchema: z.ZodObject<
  {
    language: z.ZodString;
    version: z.ZodString;
    run: z.ZodObject<
      {
        stdout: z.ZodString;
        stderr: z.ZodString;
        code: z.ZodNullable<z.ZodNumber>;
        signal: z.ZodNullable<z.ZodString>;
        time: z.ZodNumber;
        memory: z.ZodNumber;
        output_limit_exceeded: z.ZodDefault<z.ZodBoolean>;
      },
      z.core.$strip
    >;
    compile: z.ZodOptional<
      z.ZodObject<
        {
          stdout: z.ZodString;
          stderr: z.ZodString;
          code: z.ZodNullable<z.ZodNumber>;
          signal: z.ZodNullable<z.ZodString>;
          time: z.ZodNumber;
          memory: z.ZodNumber;
          output_limit_exceeded: z.ZodDefault<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
    status: z.ZodEnum<{
      OK: 'OK';
      RE: 'RE';
      SG: 'SG';
      TO: 'TO';
      XX: 'XX';
    }>;
  },
  z.core.$strip
>;
export type FilePayload = z.infer<typeof FileSchema>;
export type ExecutionRequest = z.infer<typeof ExecutionRequestSchema>;
export type StageResult = z.infer<typeof StageResultSchema>;
export type ExecutionResponse = z.infer<typeof ExecutionResponseSchema>;
//# sourceMappingURL=index.d.ts.map
