import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ConcurrencyPool } from '../../packages/api/src/pool.js';
import { type ConcurrencyConfig } from '@chadbox/shared';

describe('ConcurrencyPool Race Conditions & Burst Stress Suite', () => {
    const createTestConfig = (overrides: Partial<ConcurrencyConfig> = {}): ConcurrencyConfig => ({
        safeBaseline: 10,
        panicMemoryMb: 50,
        memoryPollIntervalMs: 50,
        maxQueueDepth: 100,
        boxPoolMin: 1,
        boxPoolMax: 50,
        ...overrides,
    });

    test('Concurrent Burst: 50 parallel acquisitions allocate 50 unique box IDs without collisions', async () => {
        const pool = new ConcurrencyPool(createTestConfig());

        // Spawn 50 simultaneous acquire operations
        const acquirePromises = Array.from({ length: 50 }, () => pool.acquireBox());
        const boxIds = await Promise.all(acquirePromises);

        // Verify total count and uniqueness
        assert.equal(boxIds.length, 50);
        const uniqueSet = new Set(boxIds);
        assert.equal(
            uniqueSet.size,
            50,
            'All allocated Box IDs in concurrent burst must be unique'
        );

        const stats = pool.getStats();
        assert.equal(stats.activeJobs, 50);
        assert.equal(stats.availableBoxes, 0);

        // Concurrently release all boxes
        boxIds.forEach((id) => pool.releaseBox(id));

        const finalStats = pool.getStats();
        assert.equal(finalStats.activeJobs, 0, 'All active jobs must be cleared after release');
        assert.equal(finalStats.availableBoxes, 50, 'All 50 boxes must be safely returned to pool');
        assert.equal(finalStats.quarantinedBoxes, 0);
    });

    test('Interleaved Cycles: 200 rapid acquire/release cycles maintain zero box leakage', async () => {
        const pool = new ConcurrencyPool(createTestConfig());

        const runCycle = async () => {
            const boxId = await pool.acquireBox();
            // Simulate random asynchronous work duration
            await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 5)));
            pool.releaseBox(boxId);
        };

        // Run 200 cycles in parallel batches within box capacity (35 concurrent per batch)
        for (let i = 0; i < 200; i += 35) {
            const batch = Array.from({ length: Math.min(35, 200 - i) }, () => runCycle());
            await Promise.all(batch);
        }

        const stats = pool.getStats();
        assert.equal(stats.activeJobs, 0, 'No active jobs should remain after all cycles resolve');
        assert.equal(stats.availableBoxes, 50, 'All 50 boxes must remain intact with zero leakage');
        assert.equal(stats.queueDepth, 0);
    });

    test('Quarantine Isolation: Quarantined boxes are never checked out in concurrent bursts', async () => {
        const pool = new ConcurrencyPool(createTestConfig());

        // Manually acquire and quarantine box 1, 2, and 3
        const b1 = await pool.acquireBox();
        const b2 = await pool.acquireBox();
        const b3 = await pool.acquireBox();
        pool.releaseBox(b1, { healthy: false });
        pool.releaseBox(b2, { healthy: false });
        pool.releaseBox(b3, { healthy: false });

        const statsAfterQuarantine = pool.getStats();
        assert.equal(statsAfterQuarantine.quarantinedBoxes, 3);
        assert.equal(statsAfterQuarantine.availableBoxes, 47);

        // Run 47 concurrent acquisitions
        const burstPromises = Array.from({ length: 47 }, () => pool.acquireBox());
        const acquiredIds = await Promise.all(burstPromises);

        assert.ok(!acquiredIds.includes(b1), `Quarantined box ${b1} was erroneously checked out`);
        assert.ok(!acquiredIds.includes(b2), `Quarantined box ${b2} was erroneously checked out`);
        assert.ok(!acquiredIds.includes(b3), `Quarantined box ${b3} was erroneously checked out`);

        // Clean up
        acquiredIds.forEach((id) => pool.releaseBox(id));
    });

    test('Backpressure Saturation: Burst exceeding queue depth throws HTTP_429 instantly', async () => {
        const strictConfig = createTestConfig({
            safeBaseline: 2,
            panicMemoryMb: 999999, // Force panic memory to force queueing
            maxQueueDepth: 3,
            boxPoolMin: 1,
            boxPoolMax: 10,
        });
        const pool = new ConcurrencyPool(strictConfig);

        // Fill active baseline (2 jobs)
        await pool.acquireBox();
        await pool.acquireBox();

        // Queue 3 jobs (max queue depth = 3)
        const q1 = pool.acquireBox();
        const q2 = pool.acquireBox();
        const q3 = pool.acquireBox();

        // 4th queued request must be rejected with HTTP_429
        await assert.rejects(async () => pool.acquireBox(), {
            message: 'HTTP_429',
        });

        // Release 1 to unblock queue and drain
        pool.releaseBox(1);
        const resolvedBox = await q1;
        pool.releaseBox(resolvedBox);
        pool.releaseBox(2);
        pool.releaseBox(await q2);
        pool.releaseBox(await q3);
    });
});
