import Fastify, { type FastifyInstance } from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
    ExecutionRequestSchema,
    config as defaultConfig,
    isLanguagePermitted,
    type ChadboxConfig,
} from '@chadbox/shared';
import { Sandbox } from '@chadbox/core';
import { pool as defaultPool, ConcurrencyPool } from './pool.js';

const execAsync = promisify(exec);

export interface BuildAppOptions {
    config?: ChadboxConfig;
    pool?: ConcurrencyPool;
    logger?: boolean;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
    const appConfig = options.config || defaultConfig;
    const appPool = options.pool || defaultPool;
    const fastify = Fastify({ logger: options.logger ?? true });

    const MAX_MOUNTS = appConfig.mounts.maxMounts;
    const IDLE_TIMEOUT_MS = appConfig.mounts.idleTimeoutMs;

    interface CacheEntry {
        promise: Promise<void>;
        lastAccessed: number;
        activeRefs: number;
    }

    // JavaScript Maps preserve insertion order.
    const globalMountCache = new Map<string, CacheEntry>();

    async function ensureGlobalMount(language: string, sqshPath: string): Promise<void> {
        const now = Date.now();

        // 1. If language is already mounted or currently mounting, reuse the in-flight promise
        const existing = globalMountCache.get(language);
        if (existing) {
            existing.lastAccessed = now;
            existing.activeRefs++;

            // Refresh LRU order in Map (delete and re-insert)
            globalMountCache.delete(language);
            globalMountCache.set(language, existing);
            return await existing.promise;
        }

        // 2. Synchronous Atomic Reservation: Create the mount promise before any async ticks
        let mountResolve!: () => void;
        let mountReject!: (err: any) => void;
        const mountPromise = new Promise<void>((resolve, reject) => {
            mountResolve = resolve;
            mountReject = reject;
        });

        const entry: CacheEntry = {
            promise: mountPromise,
            lastAccessed: now,
            activeRefs: 1,
        };
        globalMountCache.set(language, entry);

        // 3. Mount Execution with LRU Eviction & Fault Recovery
        (async () => {
            try {
                // LRU Eviction: If cache exceeds limit, unmount the oldest unused language
                if (globalMountCache.size > MAX_MOUNTS) {
                    let oldestLangToEvict: string | null = null;
                    for (const [lang, item] of globalMountCache.entries()) {
                        if (lang !== language && item.activeRefs === 0) {
                            oldestLangToEvict = lang;
                            break;
                        }
                    }
                    if (oldestLangToEvict) {
                        await forceUnmount(oldestLangToEvict);
                    } else {
                        fastify.log.warn(
                            `VFS Cache full, but all mounts are busy. Temporarily exceeding MAX_MOUNTS for ${language}`
                        );
                    }
                }

                const globalMountPath = path.join(appConfig.mounts.mountsDir, language);
                await fs.mkdir(globalMountPath, { recursive: true });
                try {
                    await execAsync(`umount ${globalMountPath} 2>/dev/null`);
                } catch {
                    // Ignore unmount errors (e.g. not mounted)
                }
                await execAsync(
                    `mount -o loop,ro,exec,nosuid,nodev ${sqshPath} ${globalMountPath}`
                );
                fastify.log.info(`💿 Mounted ${language} into VFS Cache.`);
                mountResolve();
            } catch (err) {
                // Evict immediately from cache on failure so future attempts can retry
                globalMountCache.delete(language);
                fastify.log.error({ err }, `Failed to mount ${language}`);
                mountReject(err);
            }
        })();

        return await entry.promise;
    }

    async function forceUnmount(language: string) {
        const entry = globalMountCache.get(language);
        if (!entry) return;
        if (entry.activeRefs > 0) {
            fastify.log.warn(`Skipping unmount for ${language}: activeRefs=${entry.activeRefs}`);
            return;
        }

        globalMountCache.delete(language);
        const mountPath = path.join(appConfig.mounts.mountsDir, language);
        try {
            await execAsync(`umount ${mountPath}`);
            fastify.log.info(`🧹 Evicted ${language} from VFS Cache.`);
        } catch (e) {
            fastify.log.warn(
                `Failed to unmount ${language}: ${e instanceof Error ? e.message : String(e)}`
            );
        }
    }

    // TTL Sweeper: Runs on configured interval to clean idle mounts
    const sweeperTimer = setInterval(() => {
        const cutoff = Date.now() - IDLE_TIMEOUT_MS;
        for (const [lang, entry] of globalMountCache.entries()) {
            if (entry.lastAccessed < cutoff && entry.activeRefs === 0) forceUnmount(lang);
        }
    }, appConfig.mounts.sweeperIntervalMs);

    // Periodic Background Quarantine Reaper: Recovers healthy state for temporarily stuck boxes
    const reaperTimer = setInterval(
        async () => {
            const stats = appPool.getStats();
            if (stats.quarantinedBoxes > 0) {
                fastify.log.info(
                    `Quarantine Reaper scanning ${stats.quarantinedBoxes} quarantined sandboxes...`
                );
                const recovered = await appPool.reapQuarantinedBoxes((id) =>
                    Sandbox.forceCleanup(id)
                );
                if (recovered > 0) {
                    fastify.log.info(
                        `Quarantine Reaper recovered ${recovered} sandboxes back into pool.`
                    );
                }
            }
        },
        2 * 60 * 1000
    );

    // Clear background timers when Fastify instance is closed
    fastify.addHook('onClose', async () => {
        clearInterval(sweeperTimer);
        clearInterval(reaperTimer);
    });

    // Healthcheck & Telemetry Endpoint
    fastify.get('/health', async (_request, reply) => {
        return reply.status(200).send({
            status: 'ok',
            pool: appPool.getStats(),
            mounts: {
                active: globalMountCache.size,
                max: MAX_MOUNTS,
            },
        });
    });

    // Liveness Probe (Kubernetes / Orchestrator standard)
    fastify.get('/healthz', async (_request, reply) => {
        return reply.status(200).send({ status: 'ok' });
    });

    // Readiness Probe (Evaluates sandbox and pool availability - Resolves #18)
    fastify.get('/readyz', async (_request, reply) => {
        return reply.status(200).send({
            status: 'ok',
            uptime_seconds: Math.floor(process.uptime()),
            pool: appPool.getStats(),
            mounts: {
                active: globalMountCache.size,
                max: MAX_MOUNTS,
            },
        });
    });

    // POST /api/v1/execute
    fastify.post('/api/v1/execute', async (request, reply) => {
        const parsed = ExecutionRequestSchema.safeParse(request.body);
        if (!parsed.success)
            return reply
                .status(400)
                .send({ error: 'Invalid payload', details: parsed.error.format() });

        const payload = parsed.data;

        if (!/^[a-z0-9-]+$/.test(payload.language)) {
            return reply.status(400).send({ error: 'Invalid language identifier.' });
        }

        // Access control evaluation
        const accessCheck = isLanguagePermitted(payload.language, appConfig.access);
        if (!accessCheck.permitted) {
            return reply.status(403).send({ error: accessCheck.reason });
        }

        const langJsonPath = path.join(appConfig.mounts.storageDir, `${payload.language}.json`);
        const sqshPath = path.join(appConfig.mounts.storageDir, `${payload.language}.sqsh`);
        let langMeta: any;

        try {
            langMeta = JSON.parse(await fs.readFile(langJsonPath, 'utf8'));
        } catch (e) {
            return reply
                .status(400)
                .send({ error: `Language '${payload.language}' is not installed.` });
        }

        // Validate requested version against installed manifest (Resolves #8)
        if (
            payload.version !== 'latest' &&
            langMeta.version &&
            payload.version !== langMeta.version
        ) {
            return reply.status(400).send({
                error: 'VERSION_NOT_INSTALLED',
                details: {
                    language: payload.language,
                    version: payload.version,
                    installed_version: langMeta.version,
                },
            });
        }

        let boxId: number | undefined;
        let sandbox: Sandbox | undefined;
        let isBoxClean = true;

        try {
            boxId = await appPool.acquireBox();
        } catch (error: any) {
            if (error.message === 'HTTP_429')
                return reply.status(429).send({ error: 'Too Many Requests' });
            return reply.status(500).send({ error: 'Internal Engine Error' });
        }

        let statusCode = 200;
        let responsePayload: any;

        try {
            // Asynchronous, Thread-Safe, LRU-backed Mount
            await ensureGlobalMount(payload.language, sqshPath);

            sandbox = new Sandbox({
                boxId,
                mounts: [
                    {
                        dest: `/opt/${payload.language}`,
                        src: path.join(appConfig.mounts.mountsDir, payload.language),
                    },
                ],
            });

            await sandbox.init();

            const fileNames: string[] = [];
            for (let i = 0; i < payload.files.length; i++) {
                const file = payload.files[i]!;
                let fname = file.name;
                if (!fname) {
                    fname =
                        payload.language === 'java' ? 'Main.java' : i === 0 ? 'main' : `file${i}`;
                }

                fileNames.push(fname);

                let codeData: string | Buffer;
                if (file.encoding === 'base64') {
                    codeData = Buffer.from(file.content, 'base64');
                } else if (file.encoding === 'hex') {
                    codeData = Buffer.from(file.content, 'hex');
                } else {
                    codeData = file.content;
                }

                await sandbox.writeCode(fname, codeData);
            }

            // write STDIN to a disk (even if empty) for sandbox
            await sandbox.writeCode('stdin.txt', payload.stdin || '');

            // Safely map the {files} token to the actual filenames
            const parseCmd = (cmd: string[]) =>
                cmd.flatMap((arg) => (arg === '{files}' ? fileNames : [arg]));

            let compileResult: any = undefined;

            // STAGE 1: COMPILATION (Heavy Limits)
            if (langMeta.compile_cmd) {
                const compileCmd = parseCmd(langMeta.compile_cmd);
                compileResult = await sandbox.run(compileCmd, {
                    stage: 'compile',
                    timeLimit: payload.compile_timeout / 1000,
                    memoryLimit: payload.compile_memory_limit,
                    processes: appConfig.sandbox.maxProcessesCompile, // Compilers need to spawn many threads to build ASTs
                    fsize: appConfig.sandbox.maxFsizeCompileKb, // Quota for heavy compiled binaries
                    env: langMeta.env, // Pass environment variables
                });

                // If compilation fails, short-circuit and return immediately
                if (compileResult.code !== 0) {
                    responsePayload = {
                        language: payload.language,
                        version: payload.version,
                        run: {
                            stdout: '',
                            stderr: '',
                            code: null,
                            signal: null,
                            time: 0,
                            memory: 0,
                            output_limit_exceeded: false,
                        },
                        compile: compileResult,
                        status: 'RE',
                    };
                }
            }

            // STAGE 2: EXECUTION (Strict Untrusted Limits)
            if (!responsePayload) {
                const runCmd = [...parseCmd(langMeta.run_cmd), ...(payload.args || [])];
                const runResult = await sandbox.run(runCmd, {
                    stage: 'run',
                    timeLimit: payload.run_timeout / 1000,
                    memoryLimit: payload.run_memory_limit > 0 ? payload.run_memory_limit : 256000,
                    processes: appConfig.sandbox.maxProcessesRun, // Restrict threads to prevent Fork Bombs
                    fsize: appConfig.sandbox.maxFsizeRunKb, // Configured file quota
                    env: langMeta.env, // Pass environment variables
                });

                responsePayload = {
                    language: payload.language,
                    version: payload.version,
                    run: runResult,
                    ...(compileResult && { compile: compileResult }),
                    status: runResult.code === 0 ? 'OK' : 'RE',
                };
            }
        } catch (error: any) {
            fastify.log.error(error);
            statusCode = 500;
            responsePayload = { error: 'Execution failed', details: error.message };
        } finally {
            if (globalMountCache.has(payload.language)) {
                const entry = globalMountCache.get(payload.language)!;
                entry.activeRefs = Math.max(0, entry.activeRefs - 1);
            }

            if (sandbox) {
                try {
                    const cleanupRes = await sandbox.cleanup();
                    isBoxClean = cleanupRes.success;
                    if (!cleanupRes.success) {
                        fastify.log.warn(
                            `Box ${boxId} failed cleanup: ${cleanupRes.error || 'Unknown error'}`
                        );
                    }
                } catch (cleanupErr) {
                    fastify.log.error(
                        { err: cleanupErr },
                        `Sandbox cleanup threw for box ${boxId}`
                    );
                    isBoxClean = false;
                }
            }

            if (boxId !== undefined) {
                appPool.releaseBox(boxId, { healthy: isBoxClean });
            }
        }

        return reply.status(statusCode).send(responsePayload);
    });

    // --- ADMIN WEBHOOK (For CLI Hot-Reloading) ---
    fastify.delete('/api/v1/system/cache/:language', async (request, reply) => {
        const { language } = request.params as { language: string };
        if (!/^[a-z0-9-]+$/.test(language)) {
            return reply.status(400).send({ error: 'Invalid language identifier.' });
        }
        await forceUnmount(language);
        return reply.send({ success: true, message: `Cache cleared for ${language}` });
    });

    return fastify;
}
