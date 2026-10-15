import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../../packages/api/src/app.js';
import { ConcurrencyPool } from '../../packages/api/src/pool.js';
import { loadConfig } from '@chadbox/shared';

describe('API Contract & Route Integration Tests', async () => {
    const testConfig = loadConfig({
        CHADBOX_MAX_QUEUE_DEPTH: '1',
        CHADBOX_SAFE_BASELINE: '1',
        CHADBOX_ALLOWED_LANGUAGES: 'python3,nodejs,rust',
        CHADBOX_DISABLED_LANGUAGES: 'bash',
        CHADBOX_STORAGE_DIR: '/tmp/chadbox_test_nonexistent',
    });

    const testPool = new ConcurrencyPool(testConfig.concurrency);
    const app = buildApp({
        config: testConfig,
        pool: testPool,
        logger: false,
    });

    after(async () => {
        await app.close();
    });

    test('GET /health returns 200 and telemetry data', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/health',
        });

        assert.equal(response.statusCode, 200);
        const body = JSON.parse(response.payload);
        assert.equal(body.status, 'ok');
        assert.ok(body.pool);
        assert.equal(typeof body.pool.activeJobs, 'number');
        assert.ok(body.mounts);
        assert.equal(typeof body.mounts.max, 'number');
    });

    test('GET /healthz returns 200 liveness probe', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/healthz',
        });

        assert.equal(response.statusCode, 200);
        const body = JSON.parse(response.payload);
        assert.equal(body.status, 'ok');
    });

    test('GET /readyz returns 200 readiness probe with telemetry', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/readyz',
        });

        assert.equal(response.statusCode, 200);
        const body = JSON.parse(response.payload);
        assert.equal(body.status, 'ok');
        assert.equal(typeof body.uptime_seconds, 'number');
        assert.ok(body.pool);
    });

    test('POST /api/v1/execute rejects empty payload with 400', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/execute',
            payload: {},
        });

        assert.equal(response.statusCode, 400);
        const body = JSON.parse(response.payload);
        assert.equal(body.error, 'Invalid payload');
        assert.ok(body.details);
    });

    test('POST /api/v1/execute rejects empty files array with 400', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/execute',
            payload: {
                language: 'python3',
                files: [],
            },
        });

        assert.equal(response.statusCode, 400);
        const body = JSON.parse(response.payload);
        assert.equal(body.error, 'Invalid payload');
    });

    test('POST /api/v1/execute rejects invalid/injected language identifiers with 400', async () => {
        const maliciousInputs = [
            '../../etc/passwd',
            'python3; rm -rf /',
            'python3 && cat /flag',
            'has space',
            'UPPERCASE',
            'lang$var',
        ];

        for (const input of maliciousInputs) {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/execute',
                payload: {
                    language: input,
                    files: [{ name: 'main.txt', content: 'hello' }],
                },
            });

            assert.equal(response.statusCode, 400, `Failed for input: ${input}`);
            const body = JSON.parse(response.payload);
            assert.equal(body.error, 'Invalid language identifier.');
        }
    });

    test('POST /api/v1/execute rejects disabled languages with 403 Forbidden', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/execute',
            payload: {
                language: 'bash', // Explicitly in CHADBOX_DISABLED_LANGUAGES
                files: [{ name: 'script.sh', content: 'echo 1' }],
            },
        });

        assert.equal(response.statusCode, 403);
        const body = JSON.parse(response.payload);
        assert.match(body.error, /disabled by server policy/);
    });

    test('POST /api/v1/execute rejects non-whitelisted languages with 403 Forbidden', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/execute',
            payload: {
                language: 'ruby', // Not in ['python3', 'nodejs', 'rust']
                files: [{ name: 'script.rb', content: 'puts 1' }],
            },
        });

        assert.equal(response.statusCode, 403);
        const body = JSON.parse(response.payload);
        assert.match(body.error, /not in the allowed runtime list/);
    });

    test('POST /api/v1/execute rejects uninstalled languages with 400', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/execute',
            payload: {
                language: 'python3', // Allowed, but not present in nonexistent test directory
                files: [{ name: 'main.py', content: 'print(1)' }],
            },
        });

        assert.equal(response.statusCode, 400);
        const body = JSON.parse(response.payload);
        assert.match(body.error, /is not installed/);
    });

    test('DELETE /api/v1/system/cache/:language validates language identifier', async () => {
        // Bad identifier
        const badResponse = await app.inject({
            method: 'DELETE',
            url: '/api/v1/system/cache/bad%20name%3Brm',
        });
        assert.equal(badResponse.statusCode, 400);

        // Valid identifier
        const okResponse = await app.inject({
            method: 'DELETE',
            url: '/api/v1/system/cache/python3',
        });
        assert.equal(okResponse.statusCode, 200);
        const body = JSON.parse(okResponse.payload);
        assert.equal(body.success, true);
    });

    test('POST /api/v1/execute rejects path traversal in filenames with 400', async () => {
        const maliciousFilenames = [
            '../escape.txt',
            '../../etc/shadow',
            'foo/../../bar.txt',
            '..\\windows\\escape.txt',
        ];

        for (const fname of maliciousFilenames) {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/execute',
                payload: {
                    language: 'python3',
                    files: [{ name: fname, content: 'malicious content' }],
                },
            });

            assert.equal(response.statusCode, 400, `Expected 400 for filename: ${fname}`);
            const body = JSON.parse(response.payload);
            assert.equal(body.error, 'Invalid payload');
            assert.match(JSON.stringify(body.details), /traversal/i);
        }
    });

    test('POST /api/v1/execute rejects absolute paths in filenames with 400', async () => {
        const absoluteFilenames = ['/etc/passwd', '/tmp/evil.py', '\\windows\\system32'];

        for (const fname of absoluteFilenames) {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/execute',
                payload: {
                    language: 'python3',
                    files: [{ name: fname, content: 'malicious content' }],
                },
            });

            assert.equal(response.statusCode, 400, `Expected 400 for absolute filename: ${fname}`);
            const body = JSON.parse(response.payload);
            assert.equal(body.error, 'Invalid payload');
            assert.match(JSON.stringify(body.details), /relative path/i);
        }
    });

    test('POST /api/v1/execute rejects null bytes in filenames with 400', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/execute',
            payload: {
                language: 'python3',
                files: [{ name: 'main.py\0.exe', content: 'malicious content' }],
            },
        });

        assert.equal(response.statusCode, 400);
        const body = JSON.parse(response.payload);
        assert.equal(body.error, 'Invalid payload');
        assert.match(JSON.stringify(body.details), /null bytes/i);
    });
});
