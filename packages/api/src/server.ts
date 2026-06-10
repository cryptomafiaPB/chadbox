import Fastify from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ExecutionRequestSchema } from '@chadbox/shared';
import { Sandbox, KernelManager } from '@chadbox/core';
import { pool } from './pool.js';

const execAsync = promisify(exec);
const fastify = Fastify({ logger: true });

const MAX_MOUNTS = parseInt(process.env.CHADBOX_MAX_MOUNTS || '10', 10);
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

interface CacheEntry {
    promise: Promise<void>;
    lastAccessed: number;
    activeRefs: number;
}

// JavaScript Maps preserve insertion order.
const globalMountCache = new Map<string, CacheEntry>();

async function ensureGlobalMount(language: string, sqshPath: string) {
    const now = Date.now();

    // If it exists, update its timestamp, increment refs, and return the promise
    if (globalMountCache.has(language)) {
        const entry = globalMountCache.get(language)!;
        entry.lastAccessed = now;
        entry.activeRefs++;

        // Push to the end of the Map to mark as "Most Recently Used"
        globalMountCache.delete(language);
        globalMountCache.set(language, entry);
        return entry.promise;
    }

    // LRU Eviction: If we hit the server limit, unmount the oldest unused language
    if (globalMountCache.size >= MAX_MOUNTS) {
        let oldestLangToEvict: string | null = null;
        for (const [lang, entry] of globalMountCache.entries()) {
            if (entry.activeRefs === 0) {
                oldestLangToEvict = lang;
                break; // First one found is oldest since Map preserves insertion order
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

    // Create the Mount Promise
    const mountPromise = (async () => {
        const globalMountPath = path.join('/app/languages/mounts', language);
        await fs.mkdir(globalMountPath, { recursive: true });
        try {
            await execAsync(`umount ${globalMountPath} 2>/dev/null`);
        } catch (e) {
            // Ignore unmount errors (e.g., if it wasn't mounted)
        }
        await execAsync(`mount -o loop,ro,exec,nosuid,nodev ${sqshPath} ${globalMountPath}`);
        fastify.log.info(`💿 Mounted ${language} into VFS Cache.`);
    })();

    globalMountCache.set(language, { promise: mountPromise, lastAccessed: now, activeRefs: 1 });
    await mountPromise;
}

async function forceUnmount(language: string) {
    if (!globalMountCache.has(language)) return;
    const entry = globalMountCache.get(language)!;
    if (entry.activeRefs > 0) return; // Safety check

    globalMountCache.delete(language); // Immediately remove from routing
    try {
        await execAsync(`umount /app/languages/mounts/${language}`);
        fastify.log.info(`🧹 Evicted ${language} from VFS Cache.`);
    } catch (e) {
        // Ignore unmount errors (e.g., if it wasn't mounted)
        fastify.log.warn(
            `Failed to unmount ${language}: ${e instanceof Error ? e.message : String(e)}`
        );
    }
}

// TTL Sweeper: Runs every 5 minutes to clean idle mounts
setInterval(
    () => {
        const cutoff = Date.now() - IDLE_TIMEOUT_MS;
        for (const [lang, entry] of globalMountCache.entries()) {
            if (entry.lastAccessed < cutoff && entry.activeRefs === 0) forceUnmount(lang);
        }
    },
    5 * 60 * 1000
);

fastify.post('/api/v1/execute', async (request, reply) => {
    const parsed = ExecutionRequestSchema.safeParse(request.body);
    if (!parsed.success)
        return reply.status(400).send({ error: 'Invalid payload', details: parsed.error.format() });

    const payload = parsed.data;

    if (!/^[a-z0-9-]+$/.test(payload.language)) {
        return reply.status(400).send({ error: 'Invalid language identifier.' });
    }

    const langJsonPath = path.join('/app/languages', `${payload.language}.json`);
    const sqshPath = path.join('/app/languages', `${payload.language}.sqsh`);
    let langMeta: any;

    try {
        langMeta = JSON.parse(await fs.readFile(langJsonPath, 'utf8'));
    } catch (e) {
        return reply
            .status(400)
            .send({ error: `Language '${payload.language}' is not installed.` });
    }

    let boxId: number;
    try {
        boxId = await pool.acquireBox();
    } catch (error: any) {
        if (error.message === 'HTTP_429')
            return reply.status(429).send({ error: 'Too Many Requests' });
        return reply.status(500).send({ error: 'Internal Engine Error' });
    }

    try {
        // Asynchronous, Thread-Safe, LRU-backed Mount
        await ensureGlobalMount(payload.language, sqshPath);

        const sandbox = new Sandbox({
            boxId,
            // timeLimit: payload.run_timeout / 1000,
            // memoryLimit: payload.run_memory_limit > 0 ? payload.run_memory_limit : 256000,
            mounts: [
                {
                    dest: `/opt/${payload.language}`,
                    src: path.join('/app/languages/mounts', payload.language),
                },
            ],
        });

        await sandbox.init();

        const fileNames: string[] = [];
        for (let i = 0; i < payload.files.length; i++) {
            const file = payload.files[i];
            let fname = file?.name;
            if (!fname) {
                fname = payload.language === 'java' ? 'Main.java' : i === 0 ? 'main' : `file${i}`;
            }

            fileNames.push(fname);
            await sandbox.writeCode(fname, file!.content);
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
                processes: 256, // Compilers need to spawn many threads to build ASTs
                fsize: 51200, // 50MB quota for heavy compiled binaries
                env: langMeta.env, // Pass environment variables
            });

            // If compilation fails, short-circuit and return immediately
            if (compileResult.code !== 0) {
                return reply.status(200).send({
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
                });
            }
        }

        // STAGE 2: EXECUTION (Strict Untrusted Limits)
        // Spread args
        const runCmd = [...parseCmd(langMeta.run_cmd), ...(payload.args || [])];
        const runResult = await sandbox.run(runCmd, {
            stage: 'run',
            timeLimit: payload.run_timeout / 1000,
            memoryLimit: payload.run_memory_limit > 0 ? payload.run_memory_limit : 256000,
            processes: 64, // Restrict threads to prevent Fork Bombs
            fsize: 10240, // 10MB file quota
            env: langMeta.env, // Pass environment variables
        });

        return reply.status(200).send({
            language: payload.language,
            version: payload.version,
            run: runResult,
            ...(compileResult && { compile: compileResult }),
            status: runResult.code === 0 ? 'OK' : 'RE',
        });
    } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Execution failed', details: error.message });
    } finally {
        if (globalMountCache.has(payload.language)) {
            const entry = globalMountCache.get(payload.language)!;
            entry.activeRefs = Math.max(0, entry.activeRefs - 1);
        }

        if (boxId !== undefined) {
            try {
                await execAsync(`isolate --cleanup --cg --box-id=${boxId}`);
            } catch (cleanupError) {
                fastify.log.error({ err: cleanupError }, `Failed to cleanup box ${boxId}`);
            } finally {
                pool.releaseBox(boxId);
            }
        }
    }
});

// --- ADMIN WEBHOOK (For CLI Hot-Reloading) ---
// Only accessible locally. Used when 'chad install' overwrites a .sqsh file.
fastify.delete('/api/v1/system/cache/:language', async (request, reply) => {
    const { language } = request.params as { language: string };
    await forceUnmount(language);
    return reply.send({ success: true, message: `Cache cleared for ${language}` });
});

const shutdown = async () => {
    fastify.log.info('SIGTERM received. Sweeping Mounts...');
    for (const lang of globalMountCache.keys()) {
        try {
            await execAsync(`umount /app/languages/mounts/${lang}`);
        } catch (e) {
            fastify.log.error(`Failed to unmount ${lang}: ${e}`);
        }
    }
    await fastify.close();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const start = async () => {
    try {
        fastify.log.info('🧹 Running Pre-Flight Sweep...');
        await execAsync(`umount -l /app/languages/mounts/* 2>/dev/null`).catch(() => {});
        await execAsync(`rm -rf /app/languages/mounts/* 2>/dev/null`).catch(() => {});

        await KernelManager.bootstrapCgroups();
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        fastify.log.info('🚀 Chadbox API is alive and listening on port 3000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
