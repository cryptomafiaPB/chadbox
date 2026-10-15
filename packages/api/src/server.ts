import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from '@chadbox/shared';
import { KernelManager } from '@chadbox/core';
import { buildApp } from './app.js';

const execAsync = promisify(exec);
const fastify = buildApp();

const shutdown = async () => {
    fastify.log.info('SIGTERM received. Sweeping Mounts...');
    try {
        await execAsync(`umount -l ${path.join(config.mounts.mountsDir, '*')} 2>/dev/null`).catch(
            () => {}
        );
    } catch (e) {
        fastify.log.error(`Failed to sweep mounts on shutdown: ${e}`);
    }
    await fastify.close();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const start = async () => {
    try {
        fastify.log.info('🧹 Running Pre-Flight Sweep...');
        await execAsync(`umount -l ${path.join(config.mounts.mountsDir, '*')} 2>/dev/null`).catch(
            () => {}
        );
        await execAsync(`rm -rf ${path.join(config.mounts.mountsDir, '*')} 2>/dev/null`).catch(
            () => {}
        );

        await KernelManager.bootstrapCgroups();
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        fastify.log.info('🚀 Chadbox API is alive and listening on port 3000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
