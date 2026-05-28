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

// 🚨 ARCHITECTURE FIX 1: Thread-safe Global Cache with Mutex Locks
const globalMountCache = new Set<string>();
const mountLocks = new Map<string, Promise<void>>();

async function ensureGlobalMount(language: string, sqshPath: string) {
    if (globalMountCache.has(language)) return;

    // If another request is currently mounting it, wait for it to finish!
    if (mountLocks.has(language)) {
        return mountLocks.get(language);
    }

    const mountPromise = (async () => {
        const mountsDir = '/app/languages/mounts';
        const globalMountPath = path.join(mountsDir, language);

        await fs.mkdir(mountsDir, { recursive: true });
        await fs.mkdir(globalMountPath, { recursive: true });

        try {
            await execAsync(`umount -l ${globalMountPath} 2>/dev/null`);
        } catch (e) {
            // Ignore unmount errors, it might not be mounted yet or already unmounted.
        }

        // Fully Asynchronous kernel mount! Does not block Node.js Event Loop.
        await execAsync(`mount -o loop,ro,exec,nosuid,nodev ${sqshPath} ${globalMountPath}`);
        globalMountCache.add(language);
        fastify.log.info(`💿 Globally mounted ${language} into VFS Cache.`);
    })();

    mountLocks.set(language, mountPromise);
    try {
        await mountPromise;
    } finally {
        mountLocks.delete(language);
    }
}

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
        // Safe, non-blocking, race-condition-proof mounting
        await ensureGlobalMount(payload.language, sqshPath);

        const sandbox = new Sandbox({
            boxId,
            timeLimit: payload.run_timeout / 1000,
            memoryLimit: payload.run_memory_limit > 0 ? payload.run_memory_limit : 256000,
            mounts: [
                {
                    dest: `/opt/${payload.language}`,
                    src: path.join('/app/languages/mounts', payload.language),
                },
            ],
        });

        // 🚨 ARCHITECTURE FIX 2: Await the new async init()
        await sandbox.init();

        for (const file of payload.files) {
            await sandbox.writeCode(file.name || 'main', file.content);
        }

        const args = [payload.files[0]?.name || 'main'];
        const result = await sandbox.run(langMeta.executable, args);

        return reply.status(200).send({
            language: payload.language,
            version: payload.version,
            run: result,
            status: result.code === 0 ? 'OK' : 'RE',
        });
    } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Execution failed', details: error.message });
    } finally {
        try {
            // Must instantiate sandbox outside try block if you want to clean it here,
            // but we can just use the core isolate cleanup command safely by ID.
            await execAsync(`isolate --cleanup --cg --box-id=${boxId}`).catch(() => {});
            pool.releaseBox(boxId);
        } catch (cleanupError) {
            fastify.log.error(`Failed to cleanup sandbox for boxId ${boxId}: ${cleanupError}`);
        }
    }
});

const shutdown = async () => {
    fastify.log.info('SIGTERM received. Cleaning up Global Mounts...');
    for (const lang of globalMountCache) {
        try {
            await execAsync(`umount -l /app/languages/mounts/${lang}`);
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
        await KernelManager.bootstrapCgroups();
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        fastify.log.info('🚀 Chadbox API is alive and listening on port 3000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
