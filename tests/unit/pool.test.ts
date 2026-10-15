import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ConcurrencyPool } from '../../packages/api/src/pool.js';

describe('ConcurrencyPool Lifecycle & Quarantine', () => {
    test('acquires unique box IDs and releases them', async () => {
        const testPool = new ConcurrencyPool({
            safeBaseline: 5,
            maxQueueDepth: 10,
            panicMemoryMb: 0, // always has capacity
            boxPoolMin: 10,
            boxPoolMax: 12,
            memoryPollIntervalMs: 100,
        });

        const box1 = await testPool.acquireBox();
        const box2 = await testPool.acquireBox();

        assert.notEqual(box1, box2);
        assert.equal(testPool.getStats().activeJobs, 2);
        assert.equal(testPool.getStats().availableBoxes, 1);

        testPool.releaseBox(box1, { healthy: true });
        assert.equal(testPool.getStats().activeJobs, 1);
        assert.equal(testPool.getStats().availableBoxes, 2);

        testPool.releaseBox(box2, { healthy: true });
        assert.equal(testPool.getStats().activeJobs, 0);
        assert.equal(testPool.getStats().availableBoxes, 3);
    });

    test('quarantines box when released with healthy=false', async () => {
        const testPool = new ConcurrencyPool({
            safeBaseline: 5,
            maxQueueDepth: 10,
            panicMemoryMb: 0,
            boxPoolMin: 1,
            boxPoolMax: 3,
            memoryPollIntervalMs: 100,
        });

        const boxId = await testPool.acquireBox();
        assert.equal(testPool.getStats().quarantinedBoxes, 0);

        // Release as unhealthy
        testPool.releaseBox(boxId, { healthy: false });

        assert.equal(testPool.isQuarantined(boxId), true);
        assert.equal(testPool.getStats().quarantinedBoxes, 1);
        // Active jobs decremented even if quarantined
        assert.equal(testPool.getStats().activeJobs, 0);
        // Box is NOT in available pool
        assert.equal(testPool.getStats().availableBoxes, 2);
    });

    test('recovers quarantined boxes when cleanup succeeds', async () => {
        const testPool = new ConcurrencyPool({
            safeBaseline: 5,
            maxQueueDepth: 10,
            panicMemoryMb: 0,
            boxPoolMin: 1,
            boxPoolMax: 2,
            memoryPollIntervalMs: 100,
        });

        const boxId = await testPool.acquireBox();
        testPool.releaseBox(boxId, { healthy: false });

        assert.equal(testPool.getStats().quarantinedBoxes, 1);

        // Attempt recovery with successful cleanup
        const recovered = await testPool.reapQuarantinedBoxes(async (_id) => {
            // Simulated successful cleanup
        });

        assert.equal(recovered, 1);
        assert.equal(testPool.getStats().quarantinedBoxes, 0);
        assert.equal(testPool.getStats().availableBoxes, 2);
        assert.equal(testPool.isQuarantined(boxId), false);
    });

    test('keeps box quarantined if cleanup throws', async () => {
        const testPool = new ConcurrencyPool({
            safeBaseline: 5,
            maxQueueDepth: 10,
            panicMemoryMb: 0,
            boxPoolMin: 1,
            boxPoolMax: 2,
            memoryPollIntervalMs: 100,
        });

        const boxId = await testPool.acquireBox();
        testPool.releaseBox(boxId, { healthy: false });

        // Attempt recovery with failing cleanup
        const recovered = await testPool.reapQuarantinedBoxes(async (_id) => {
            throw new Error('Device or resource busy');
        });

        assert.equal(recovered, 0);
        assert.equal(testPool.getStats().quarantinedBoxes, 1);
        assert.equal(testPool.isQuarantined(boxId), true);
    });

    test('enforces strict backpressure when queue is full', async () => {
        const testPool = new ConcurrencyPool({
            safeBaseline: 1,
            maxQueueDepth: 2,
            panicMemoryMb: 999999, // Force no capacity so subsequent jobs queue
            boxPoolMin: 1,
            boxPoolMax: 10,
            memoryPollIntervalMs: 100,
        });

        await testPool.acquireBox(); // Active = 1

        // Queue job 1
        const p1 = testPool.acquireBox();
        // Queue job 2
        const p2 = testPool.acquireBox();

        assert.equal(testPool.getStats().queueDepth, 2);

        // 3rd job should be rejected immediately with HTTP_429
        await assert.rejects(
            async () => {
                await testPool.acquireBox();
            },
            {
                message: 'HTTP_429',
            }
        );

        // Release original box to unblock queued jobs
        testPool.releaseBox(1, { healthy: true });
        const boxQ1 = await p1;
        testPool.releaseBox(boxQ1, { healthy: true });
        const boxQ2 = await p2;
        testPool.releaseBox(boxQ2, { healthy: true });
    });
});
