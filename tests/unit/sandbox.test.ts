import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Sandbox } from '@chadbox/core';

describe('Sandbox Lifecycle & State Machine', () => {
    test('initializes with UNINITIALIZED state', () => {
        const sandbox = new Sandbox({ boxId: 42 });
        assert.equal(sandbox.getState(), 'UNINITIALIZED');
        assert.equal(sandbox.getBoxPath(), '');
    });

    test('cleanup on UNINITIALIZED sandbox is a safe no-op', async () => {
        const sandbox = new Sandbox({ boxId: 42 });
        const result = await sandbox.cleanup();

        assert.equal(result.success, true);
        assert.equal(sandbox.getState(), 'UNINITIALIZED');
    });

    test('cleanup is idempotent', async () => {
        const sandbox = new Sandbox({ boxId: 42 });
        const result1 = await sandbox.cleanup();
        const result2 = await sandbox.cleanup();

        assert.equal(result1.success, true);
        assert.equal(result2.success, true);
    });

    test('writeCode rejects when sandbox is not initialized', async () => {
        const sandbox = new Sandbox({ boxId: 42 });

        await assert.rejects(
            async () => {
                await sandbox.writeCode('test.py', 'print(1)');
            },
            {
                message: 'Sandbox not initialized',
            }
        );
    });

    test('run rejects when sandbox is not initialized', async () => {
        const sandbox = new Sandbox({ boxId: 42 });

        await assert.rejects(
            async () => {
                await sandbox.run(['python3', 'test.py'], {
                    stage: 'run',
                    timeLimit: 3,
                    memoryLimit: 128000,
                });
            },
            {
                message: 'Sandbox not initialized',
            }
        );
    });
});
