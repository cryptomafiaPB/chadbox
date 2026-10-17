import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    CeilingsConfigSchema,
    ConcurrencyConfigSchema,
    ExecutionRequestSchema,
    loadConfig,
    isLanguagePermitted,
} from '@chadbox/shared';

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

    test('rejects invalid cross-field concurrency and ceiling values', () => {
        assert.equal(ConcurrencyConfigSchema.safeParse({ boxPoolMin: 100, boxPoolMax: 10 }).success, false);
        assert.equal(
            CeilingsConfigSchema.safeParse({
                defaultCompileTimeoutMs: 14000,
                maxCompileTimeoutMs: 13000,
            }).success,
            false
        );
        assert.equal(
            CeilingsConfigSchema.safeParse({
                defaultRunTimeoutMs: 11000,
                maxRunTimeoutMs: 10000,
            }).success,
            false
        );
        assert.equal(
            CeilingsConfigSchema.safeParse({
                defaultCompileMemoryKb: 1100000,
                maxCompileMemoryKb: 1024000,
            }).success,
            false
        );
        assert.equal(
            CeilingsConfigSchema.safeParse({
                defaultRunMemoryKb: 520000,
                maxRunMemoryKb: 512000,
            }).success,
            false
        );
    });

    test('rejects invalid numeric environment values and defaults empty values', () => {
        assert.throws(() => loadConfig({ CHADBOX_SAFE_BASELINE: '0' }));
        assert.throws(() => loadConfig({ CHADBOX_SAFE_BASELINE: 'abc' }));
        assert.equal(
            loadConfig({ CHADBOX_SAFE_BASELINE: '' }).concurrency.safeBaseline,
            5
        );
    });

    test('rejects unsafe, reserved, and duplicate execution filenames', () => {
        const request = {
            language: 'python3',
            files: [{ name: 'main.py', content: '' }],
        };
        assert.equal(
            ExecutionRequestSchema.safeParse({
                ...request,
                files: [{ name: 'src/main.py', content: '' }],
            }).success,
            false
        );
        for (const name of [
            'stdin.txt',
            'compile_stdout.txt',
            'compile_stderr.txt',
            'run_stdout.txt',
            'run_stderr.txt',
        ]) {
            assert.equal(
                ExecutionRequestSchema.safeParse({
                    ...request,
                    files: [{ name, content: '' }],
                }).success,
                false,
                `${name} should be reserved`
            );
        }
        assert.equal(
            ExecutionRequestSchema.safeParse({
                ...request,
                files: [
                    { name: 'main.py', content: 'first' },
                    { name: 'main.py', content: 'second' },
                ],
            }).success,
            false
        );
        assert.equal(
            ExecutionRequestSchema.safeParse({
                language: 'python3',
                files: [{ content: '' }, { name: 'main', content: '' }],
            }).success,
            false
        );
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

        const bothLists = isLanguagePermitted('python3', {
            allowedLanguages: ['python3'],
            disabledLanguages: ['python3'],
        });
        assert.equal(bothLists.permitted, false);
        assert.match(bothLists.reason || '', /disabled by server policy/);
    });
});
