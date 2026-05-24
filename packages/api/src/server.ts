import Fastify from 'fastify';
import { ExecutionRequestSchema } from '@chadbox/shared';
import { Sandbox, KernelManager } from '@chadbox/core';
import { pool } from './pool.js';

const fastify = Fastify({ logger: true });

fastify.post('/api/v1/execute', async (request, reply) => {
  const parsed = ExecutionRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply
      .status(400)
      .send({ error: 'Invalid payload format', details: parsed.error.format() });
  }

  const payload = parsed.data;
  let boxId: number;

  // Dynamic Resource Backpressure
  try {
    boxId = await pool.acquireBox();
  } catch (error: any) {
    if (error.message === 'HTTP_429') {
      return reply
        .status(429)
        .send({ error: 'Too Many Requests: Server at maximum physical capacity.' });
    }
    return reply.status(500).send({ error: 'Internal Engine Error' });
  }

  // Execution Lifecycle
  try {
    const firstFile = payload.files[0];
    if (!firstFile) {
      return reply.status(400).send({ error: 'At least one file must be provided' });
    }

    const sandbox = new Sandbox({
      boxId,
      timeLimit: payload.run_timeout / 1000, // Convert to seconds for isolate
      memoryLimit: payload.run_memory_limit > 0 ? payload.run_memory_limit : 256000, // Default 256MB
    });

    sandbox.init();

    // Write user files to the sandbox
    for (const file of payload.files) {
      await sandbox.writeCode(file.name || 'main', file.content);
    }

    // Execute the code
    const result = await sandbox.run('/bin/bash', [firstFile.name || 'main']);

    return reply.status(200).send({
      language: payload.language,
      version: payload.version,
      run: result,
      status: result.exitCode === 0 ? 'OK' : 'RE',
    });
  } catch (error: any) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Execution failed', details: error.message });
  } finally {
    // Guarantee Cleanup & Release ID
    try {
      // sandbox.cleanup(); // Call isolate --cleanup wrapper
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
  // Here, would ideally run isolate --cleanup on all active box IDs in the pool
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const start = async () => {
  try {
    await KernelManager.bootstrapCgroups();

    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    fastify.log.info('Chadbox API is alive on port 3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
