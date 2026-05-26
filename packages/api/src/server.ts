import Fastify from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { ExecutionRequestSchema } from '@chadbox/shared';
import { Sandbox, KernelManager } from '@chadbox/core';
import { pool } from './pool.js';

const fastify = Fastify({ logger: true });

fastify.post('/api/v1/execute', async (request, reply) => {
  const parsed = ExecutionRequestSchema.safeParse(request.body);
  if (!parsed.success)
    return reply
      .status(400)
      .send({ error: 'Invalid payload format', details: parsed.error.format() });

  const payload = parsed.data;

  // Only allow lowercase letters, numbers, and hyphens for language identifiers
  if (!/^[a-z0-9-]+$/.test(payload.language)) {
    return reply
      .status(400)
      .send({ error: 'Invalid language identifier. Malicious path detected.' });
  }

  // DYNAMIC LANGUAGE RESOLUTION
  const langJsonPath = path.join('/app/languages', `${payload.language}.json`);
  const sqshPath = path.join('/app/languages', `${payload.language}.sqsh`);
  let langMeta: any;

  try {
    const metaRaw = await fs.readFile(langJsonPath, 'utf8');
    langMeta = JSON.parse(metaRaw);
  } catch (e) {
    return reply
      .status(400)
      .send({ error: `Language environment '${payload.language}' is not installed.` });
  }

  let boxId: number;
  try {
    boxId = await pool.acquireBox();
  } catch (error: any) {
    if (error.message === 'HTTP_429') return reply.status(429).send({ error: 'Too Many Requests' });
    return reply.status(500).send({ error: 'Internal Engine Error' });
  }

  // INJECT MOUNTS INTO SANDBOX
  const sandbox = new Sandbox({
    boxId,
    timeLimit: payload.run_timeout / 1000,
    memoryLimit: payload.run_memory_limit > 0 ? payload.run_memory_limit : 256000,
    mounts: [{ dest: `/opt/${payload.language}`, src: sqshPath }],
  });

  try {
    sandbox.init();

    for (const file of payload.files) {
      await sandbox.writeCode(file.name || 'main', file.content);
    }

    const executable = langMeta.executable; // e.g. /opt/python3/bin/python3
    const args = [payload.files[0]?.name || 'main'];

    const result = await sandbox.run(executable, args);

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
      sandbox.cleanup();
      pool.releaseBox(boxId);
    } catch (cleanupError) {
      fastify.log.error(`Failed to cleanup box ${boxId}`);
    }
  }
});

// Graceful Shutdown Shield (PID 1)
const shutdown = async () => {
  fastify.log.info('SIGTERM received. Shutting down gracefully...');
  await fastify.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Boot the Engine
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
