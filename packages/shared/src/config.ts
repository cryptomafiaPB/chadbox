import { z } from 'zod';

const listSchema = z.union([
    z.string().transform((val) =>
        val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
    ),
    z.array(z.string()),
]);

const nullableListSchema = z
    .union([
        z.string().transform((val) => {
            const arr = val
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            return arr.length > 0 ? arr : null;
        }),
        z.array(z.string()),
    ])
    .nullable();

export const ConcurrencyConfigSchema = z.object({
    /**
     * Soft concurrency baseline before memory capacity checks engage.
     */
    safeBaseline: z.coerce.number().int().positive().default(5),
    /**
     * Maximum number of requests allowed in the waiting queue before returning HTTP 429.
     */
    maxQueueDepth: z.coerce.number().int().positive().default(50),
    /**
     * Minimum free host RAM (in MB) required to spawn new sandboxes.
     */
    panicMemoryMb: z.coerce.number().int().positive().default(100),
    /**
     * Starting Box ID for isolate sandbox sandboxes.
     */
    boxPoolMin: z.coerce.number().int().nonnegative().default(1),
    /**
     * Ending Box ID for isolate sandbox sandboxes.
     */
    boxPoolMax: z.coerce.number().int().positive().default(1000),
    /**
     * Milliseconds to throttle/cache os.freemem checks to prevent event-loop stalls.
     */
    memoryPollIntervalMs: z.coerce.number().int().positive().default(500),
});

export const MountsConfigSchema = z.object({
    /**
     * Maximum number of language bundles mounted simultaneously in the LRU VFS cache.
     */
    maxMounts: z.coerce.number().int().positive().default(10),
    /**
     * Time in ms after which an unreferenced mount can be evicted by the sweeper (default: 15 min).
     */
    idleTimeoutMs: z.coerce
        .number()
        .int()
        .positive()
        .default(15 * 60 * 1000),
    /**
     * Interval in ms for background sweeper to evict idle mounts (default: 5 min).
     */
    sweeperIntervalMs: z.coerce
        .number()
        .int()
        .positive()
        .default(5 * 60 * 1000),
    /**
     * Directory path where language SquashFS bundles and JSON manifests reside.
     */
    storageDir: z.string().default('/app/languages'),
    /**
     * Directory path where SquashFS images are mounted.
     */
    mountsDir: z.string().default('/app/languages/mounts'),
});

export const AccessConfigSchema = z.object({
    /**
     * Optional whitelist of allowed language identifiers. If null, all installed languages are allowed.
     */
    allowedLanguages: nullableListSchema.default(null),
    /**
     * Optional blacklist of language identifiers that are disallowed from execution.
     */
    disabledLanguages: listSchema.default([]),
});

export const CeilingsConfigSchema = z.object({
    defaultCompileTimeoutMs: z.coerce.number().int().positive().default(10000),
    maxCompileTimeoutMs: z.coerce.number().int().positive().default(13000),
    defaultRunTimeoutMs: z.coerce.number().int().positive().default(3000),
    maxRunTimeoutMs: z.coerce.number().int().positive().default(10000),
    defaultCompileMemoryKb: z.coerce.number().int().positive().default(512000),
    maxCompileMemoryKb: z.coerce.number().int().positive().default(1024000),
    defaultRunMemoryKb: z.coerce.number().int().positive().default(128000),
    maxRunMemoryKb: z.coerce.number().int().positive().default(512000),
});

export const SandboxLimitsConfigSchema = z.object({
    /**
     * Maximum processes/threads allowed during compilation stage (to build ASTs).
     */
    maxProcessesCompile: z.coerce.number().int().positive().default(256),
    /**
     * Maximum processes/threads allowed during execution stage (fork bomb prevention).
     */
    maxProcessesRun: z.coerce.number().int().positive().default(64),
    /**
     * Maximum file size in KB during compilation (default: 50MB).
     */
    maxFsizeCompileKb: z.coerce.number().int().positive().default(51200),
    /**
     * Maximum file size in KB during execution (default: 10MB).
     */
    maxFsizeRunKb: z.coerce.number().int().positive().default(10240),
    /**
     * Maximum stdout/stderr output buffer size in bytes before truncation (default: 64KB).
     */
    maxOutputBytes: z.coerce.number().int().positive().default(65535),
});

export const ChadboxConfigSchema = z.object({
    concurrency: ConcurrencyConfigSchema.default(() => ConcurrencyConfigSchema.parse({})),
    mounts: MountsConfigSchema.default(() => MountsConfigSchema.parse({})),
    access: AccessConfigSchema.default(() => AccessConfigSchema.parse({})),
    ceilings: CeilingsConfigSchema.default(() => CeilingsConfigSchema.parse({})),
    sandbox: SandboxLimitsConfigSchema.default(() => SandboxLimitsConfigSchema.parse({})),
});

export type ConcurrencyConfig = z.infer<typeof ConcurrencyConfigSchema>;
export type MountsConfig = z.infer<typeof MountsConfigSchema>;
export type AccessConfig = z.infer<typeof AccessConfigSchema>;
export type CeilingsConfig = z.infer<typeof CeilingsConfigSchema>;
export type SandboxLimitsConfig = z.infer<typeof SandboxLimitsConfigSchema>;
export type ChadboxConfig = z.infer<typeof ChadboxConfigSchema>;

/**
 * Loads and validates Chadbox configuration from environment variables or a provided dictionary.
 */
export function loadConfig(
    rawEnv: Record<string, string | undefined> = process.env
): ChadboxConfig {
    const raw = {
        concurrency: {
            safeBaseline: rawEnv.CHADBOX_SAFE_BASELINE,
            maxQueueDepth: rawEnv.CHADBOX_MAX_QUEUE_DEPTH,
            panicMemoryMb: rawEnv.CHADBOX_PANIC_MEMORY_MB,
            boxPoolMin: rawEnv.CHADBOX_BOX_POOL_MIN,
            boxPoolMax: rawEnv.CHADBOX_BOX_POOL_MAX,
            memoryPollIntervalMs: rawEnv.CHADBOX_MEM_POLL_INTERVAL_MS,
        },
        mounts: {
            maxMounts: rawEnv.CHADBOX_MAX_MOUNTS,
            idleTimeoutMs: rawEnv.CHADBOX_IDLE_TIMEOUT_MS,
            sweeperIntervalMs: rawEnv.CHADBOX_SWEEPER_INTERVAL_MS,
            storageDir: rawEnv.CHADBOX_STORAGE_DIR,
            mountsDir: rawEnv.CHADBOX_MOUNTS_DIR,
        },
        access: {
            allowedLanguages: rawEnv.CHADBOX_ALLOWED_LANGUAGES,
            disabledLanguages: rawEnv.CHADBOX_DISABLED_LANGUAGES,
        },
        ceilings: {
            defaultCompileTimeoutMs: rawEnv.CHADBOX_DEFAULT_COMPILE_TIMEOUT_MS,
            maxCompileTimeoutMs: rawEnv.CHADBOX_MAX_COMPILE_TIMEOUT_MS,
            defaultRunTimeoutMs: rawEnv.CHADBOX_DEFAULT_RUN_TIMEOUT_MS,
            maxRunTimeoutMs: rawEnv.CHADBOX_MAX_RUN_TIMEOUT_MS,
            defaultCompileMemoryKb: rawEnv.CHADBOX_DEFAULT_COMPILE_MEMORY_KB,
            maxCompileMemoryKb: rawEnv.CHADBOX_MAX_COMPILE_MEMORY_KB,
            defaultRunMemoryKb: rawEnv.CHADBOX_DEFAULT_RUN_MEMORY_KB,
            maxRunMemoryKb: rawEnv.CHADBOX_MAX_RUN_MEMORY_KB,
        },
        sandbox: {
            maxProcessesCompile: rawEnv.CHADBOX_MAX_PROCESSES_COMPILE,
            maxProcessesRun: rawEnv.CHADBOX_MAX_PROCESSES_RUN,
            maxFsizeCompileKb: rawEnv.CHADBOX_MAX_FSIZE_COMPILE_KB,
            maxFsizeRunKb: rawEnv.CHADBOX_MAX_FSIZE_RUN_KB,
            maxOutputBytes: rawEnv.CHADBOX_MAX_OUTPUT_BYTES,
        },
    };

    // Strip undefined values so Zod schema defaults take effect
    const cleanObject = (obj: any): any => {
        if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj;
        const res: Record<string, any> = {};
        for (const [k, v] of Object.entries(obj)) {
            if (v !== undefined && v !== '') {
                res[k] = cleanObject(v);
            }
        }
        return res;
    };

    return ChadboxConfigSchema.parse(cleanObject(raw));
}

/**
 * Access control utility to evaluate whether a language is permitted to execute.
 */
export function isLanguagePermitted(
    language: string,
    accessConfig: AccessConfig
): { permitted: boolean; reason?: string } {
    if (accessConfig.disabledLanguages && accessConfig.disabledLanguages.includes(language)) {
        return {
            permitted: false,
            reason: `Language '${language}' is disabled by server policy.`,
        };
    }

    if (
        accessConfig.allowedLanguages &&
        accessConfig.allowedLanguages.length > 0 &&
        !accessConfig.allowedLanguages.includes(language)
    ) {
        return {
            permitted: false,
            reason: `Language '${language}' is not in the allowed runtime list.`,
        };
    }

    return { permitted: true };
}

/**
 * Global singleton configuration instance loaded from process.env
 */
export const config: ChadboxConfig = loadConfig();
