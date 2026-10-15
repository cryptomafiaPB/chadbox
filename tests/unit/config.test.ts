import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, isLanguagePermitted } from '@chadbox/shared';

describe('Centralized Configuration System', () => {
    test('loads standard defaults when no environment variables are provided', () => {
        const config = loadConfig({});

        assert.equal(config.concurrency.safeBaseline, 5);
        assert.equal(config.concurrency.maxQueueDepth, 50);
        assert.equal(config.concurrency.panicMemoryMb, 100);
        assert.equal(config.mounts.maxMounts, 10);
        assert.equal(config.mounts.idleTimeoutMs, 15 * 60 * 1000);
        assert.equal(config.mounts.storageDir, '/app/languages');
        assert.equal(config.access.allowedLanguages, null);
        assert.deepEqual(config.access.disabledLanguages, []);
        assert.equal(config.sandbox.maxProcessesRun, 64);
        assert.equal(config.sandbox.maxOutputBytes, 65535);
    });

    test('coerces and overrides values from environment variables', () => {
        const customEnv = {
            CHADBOX_SAFE_BASELINE: '12',
            CHADBOX_MAX_QUEUE_DEPTH: '200',
            CHADBOX_PANIC_MEMORY_MB: '512',
            CHADBOX_MAX_MOUNTS: '25',
            CHADBOX_ALLOWED_LANGUAGES: 'python3, nodejs, rust',
            CHADBOX_DISABLED_LANGUAGES: 'bash, ruby',
            CHADBOX_MAX_OUTPUT_BYTES: '131072',
        };

        const config = loadConfig(customEnv);

        assert.equal(config.concurrency.safeBaseline, 12);
        assert.equal(config.concurrency.maxQueueDepth, 200);
        assert.equal(config.concurrency.panicMemoryMb, 512);
        assert.equal(config.mounts.maxMounts, 25);
        assert.deepEqual(config.access.allowedLanguages, ['python3', 'nodejs', 'rust']);
        assert.deepEqual(config.access.disabledLanguages, ['bash', 'ruby']);
        assert.equal(config.sandbox.maxOutputBytes, 131072);
    });

    test('validates access control permissions', () => {
        const access = {
            allowedLanguages: ['python3', 'nodejs'],
            disabledLanguages: ['bash'],
        };

        // Allowed language
        const pyResult = isLanguagePermitted('python3', access);
        assert.equal(pyResult.permitted, true);

        // Not in whitelist
        const rustResult = isLanguagePermitted('rust', access);
        assert.equal(rustResult.permitted, false);
        assert.match(rustResult.reason || '', /not in the allowed runtime list/);

        // In blacklist
        const bashResult = isLanguagePermitted('bash', access);
        assert.equal(bashResult.permitted, false);
        assert.match(bashResult.reason || '', /disabled by server policy/);
    });
});
