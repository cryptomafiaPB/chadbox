import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

const API_BASE_URL = process.env['CHADBOX_TEST_API_URL'] || 'http://localhost:3000';

describe('Phase 2: Security Attack & Kernel Sandbox Isolation', () => {
    let isLiveEngineAvailable = false;

    before(async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500);
            const res = await fetch(`${API_BASE_URL}/health`, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (res.ok) {
                const body = (await res.json()) as any;
                if (body.status === 'ok') {
                    isLiveEngineAvailable = true;
                }
            }
        } catch {
            isLiveEngineAvailable = false;
        }
    });

    test('OOM Attack: Contain memory exhaustion and report SIGKILL (OOM)', async (t) => {
        if (!isLiveEngineAvailable) {
            t.skip(`Chadbox engine not running at ${API_BASE_URL}`);
            return;
        }

        // Allocate 100MB with a 32MB cgroup limit
        const res = await fetch(`${API_BASE_URL}/api/v1/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: 'python3',
                run_memory_limit: 32000,
                files: [
                    {
                        name: 'main.py',
                        content: 'x = bytearray(100 * 1024 * 1024)\nprint("SHOULD_NOT_REACH")',
                    },
                ],
            }),
        });

        assert.equal(res.status, 200);
        const data = (await res.json()) as any;

        assert.equal(data.status, 'RE', 'Process exceeding memory limit must result in RE');
        assert.equal(data.run.code !== 0, true, 'Exit code must be non-zero');
        assert.match(
            data.run.signal || '',
            /SIGKILL \(OOM\)|SIGKILL/i,
            'Process must be terminated by kernel cgroup OOM'
        );
        assert.ok(!data.run.stdout.includes('SHOULD_NOT_REACH'));
    });

    test('Timeout Attack: Wall-clock SIGKILL terminates infinite CPU loop', async (t) => {
        if (!isLiveEngineAvailable) {
            t.skip(`Chadbox engine not running at ${API_BASE_URL}`);
            return;
        }

        const startTime = Date.now();
        const res = await fetch(`${API_BASE_URL}/api/v1/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: 'python3',
                run_timeout: 1500, // 1.5s
                files: [
                    {
                        name: 'main.py',
                        content: 'while True:\n    pass\n',
                    },
                ],
            }),
        });

        const elapsed = Date.now() - startTime;
        assert.equal(res.status, 200);
        const data = (await res.json()) as any;

        assert.equal(data.status, 'RE', 'Timeout must terminate with RE');
        assert.equal(data.run.signal, 'SIGKILL (Timeout)', 'Signal must be SIGKILL (Timeout)');
        assert.ok(
            elapsed < 4500,
            `Execution must be killed promptly (took ${elapsed}ms for 1.5s limit)`
        );
    });

    test('Fork Bomb Attack: Restrict threads/processes and maintain engine stability', async (t) => {
        if (!isLiveEngineAvailable) {
            t.skip(`Chadbox engine not running at ${API_BASE_URL}`);
            return;
        }

        const res = await fetch(`${API_BASE_URL}/api/v1/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: 'python3',
                run_timeout: 3000,
                files: [
                    {
                        name: 'main.py',
                        content: `
import os
while True:
    try:
        os.fork()
    except OSError:
        pass
`,
                    },
                ],
            }),
        });

        assert.equal(res.status, 200);
        const data = (await res.json()) as any;

        assert.equal(data.status, 'RE', 'Fork bomb must be terminated with RE');
        assert.equal(data.run.code !== 0, true);
    });

    test('Disk Quota Flood: Block writes exceeding fsize limit', async (t) => {
        if (!isLiveEngineAvailable) {
            t.skip(`Chadbox engine not running at ${API_BASE_URL}`);
            return;
        }

        // Attempt writing 50MB when default fsize limit is ~10MB (10240KB)
        const res = await fetch(`${API_BASE_URL}/api/v1/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: 'python3',
                files: [
                    {
                        name: 'main.py',
                        content: `
with open("huge.dat", "wb") as f:
    f.write(b"X" * (50 * 1024 * 1024))
print("FILE_WRITE_COMPLETED")
`,
                    },
                ],
            }),
        });

        assert.equal(res.status, 200);
        const data = (await res.json()) as any;

        assert.equal(data.status, 'RE', 'File size limit exceed must result in RE');
        assert.match(
            data.run.stderr,
            /File too large|OSError/i,
            'Error output must indicate file size quota violation'
        );
        assert.ok(!data.run.stdout.includes('FILE_WRITE_COMPLETED'));
    });

    test('Filesystem Jailbreak: Prevent access to /etc/shadow, /etc/passwd and cgroups', async (t) => {
        if (!isLiveEngineAvailable) {
            t.skip(`Chadbox engine not running at ${API_BASE_URL}`);
            return;
        }

        const res = await fetch(`${API_BASE_URL}/api/v1/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: 'python3',
                files: [
                    {
                        name: 'main.py',
                        content: `
# 1. Attempt reading host /etc/shadow
try:
    with open('/etc/shadow', 'r') as f:
        print("EXPLOIT_SHADOW:", f.read(50))
except Exception as e:
    print(f"DEFENSE_SHADOW: {type(e).__name__}")

# 2. Attempt overwriting /etc/passwd
try:
    with open('/etc/passwd', 'w') as f:
        f.write("hacked:x:0:0::/root:/bin/sh")
    print("EXPLOIT_PASSWD")
except Exception as e:
    print(f"DEFENSE_PASSWD: {type(e).__name__}")

# 3. Attempt inspecting host cgroup structure
try:
    import os
    print("EXPLOIT_CGROUP:", os.listdir('/sys/fs/cgroup'))
except Exception as e:
    print(f"DEFENSE_CGROUP: {type(e).__name__}")
`,
                    },
                ],
            }),
        });

        assert.equal(res.status, 200);
        const data = (await res.json()) as any;

        assert.equal(data.status, 'OK');
        assert.ok(!data.run.stdout.includes('EXPLOIT_SHADOW'));
        assert.ok(!data.run.stdout.includes('EXPLOIT_PASSWD'));
        assert.ok(!data.run.stdout.includes('EXPLOIT_CGROUP'));

        assert.match(data.run.stdout, /DEFENSE_SHADOW: FileNotFoundError/);
        assert.match(data.run.stdout, /DEFENSE_PASSWD: PermissionError/);
        assert.match(data.run.stdout, /DEFENSE_CGROUP: FileNotFoundError/);
    });

    test('Network Egress Isolation: Sandboxed code cannot establish outbound connections', async (t) => {
        if (!isLiveEngineAvailable) {
            t.skip(`Chadbox engine not running at ${API_BASE_URL}`);
            return;
        }

        const res = await fetch(`${API_BASE_URL}/api/v1/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: 'python3',
                files: [
                    {
                        name: 'main.py',
                        content: `
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(1.5)
try:
    s.connect(('8.8.8.8', 53))
    print("EXPLOIT_NET_CONNECTED")
except Exception as e:
    print(f"DEFENSE_NET_BLOCKED: {type(e).__name__}")
`,
                    },
                ],
            }),
        });

        assert.equal(res.status, 200);
        const data = (await res.json()) as any;

        assert.equal(data.status, 'OK');
        assert.ok(!data.run.stdout.includes('EXPLOIT_NET_CONNECTED'));
        assert.match(data.run.stdout, /DEFENSE_NET_BLOCKED: (OSError|TimeoutError)/);
    });

    test('Path Traversal Exploit: Filename escape attempts are blocked and rejected', async (t) => {
        if (!isLiveEngineAvailable) {
            t.skip(`Chadbox engine not running at ${API_BASE_URL}`);
            return;
        }

        const res = await fetch(`${API_BASE_URL}/api/v1/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: 'python3',
                files: [
                    {
                        name: '../escaped_file.txt',
                        content: 'evil content',
                    },
                ],
            }),
        });

        assert.equal(res.status, 400, 'Path traversal must be rejected with 400 Bad Request');
        const data = (await res.json()) as any;
        assert.equal(data.error, 'Invalid payload');
        assert.match(JSON.stringify(data.details), /traversal/i);
    });

    test('PID Namespace Isolation: Sandboxed code cannot inspect host processes via /proc', async (t) => {
        if (!isLiveEngineAvailable) {
            t.skip(`Chadbox engine not running at ${API_BASE_URL}`);
            return;
        }

        const res = await fetch(`${API_BASE_URL}/api/v1/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: 'python3',
                files: [
                    {
                        name: 'main.py',
                        content: `
import os
pids = [int(p) for p in os.listdir('/proc') if p.isdigit()]
# In an isolated PID namespace, only the container isolate procs (e.g. 1, 2) should exist
# Host PIDs (>100 or hundreds of processes) must not leak
print("PIDS_COUNT:", len(pids))
print("MAX_PID:", max(pids) if pids else 0)
`,
                    },
                ],
            }),
        });

        assert.equal(res.status, 200);
        const data = (await res.json()) as any;
        assert.equal(data.status, 'OK');

        const pidsCountMatch = data.run.stdout.match(/PIDS_COUNT:\s*(\d+)/);
        const pidsCount = parseInt(pidsCountMatch ? pidsCountMatch[1] : '999', 10);
        assert.ok(
            pidsCount <= 5,
            `PID namespace leaked processes! Saw ${pidsCount} visible processes in /proc`
        );
    });

    test('Base64 Binary Payload: Safely decode and execute binary assets inside sandbox', async (t) => {
        if (!isLiveEngineAvailable) {
            t.skip(`Chadbox engine not running at ${API_BASE_URL}`);
            return;
        }

        // Base64 for "Secure Binary Asset Content 12345"
        const base64Content = Buffer.from('Secure Binary Asset Content 12345').toString('base64');

        const res = await fetch(`${API_BASE_URL}/api/v1/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: 'python3',
                files: [
                    {
                        name: 'main.py',
                        content: `
with open('asset.bin', 'rb') as f:
    data = f.read()
print("DECODED:", data.decode('utf-8'))
`,
                    },
                    {
                        name: 'asset.bin',
                        content: base64Content,
                        encoding: 'base64',
                    },
                ],
            }),
        });

        assert.equal(res.status, 200);
        const data = (await res.json()) as any;
        assert.equal(data.status, 'OK');
        assert.match(data.run.stdout, /DECODED: Secure Binary Asset Content 12345/);
    });

    test('Post-Attack Engine Recovery: Normal jobs execute and box telemetry is clean', async (t) => {
        if (!isLiveEngineAvailable) {
            t.skip(`Chadbox engine not running at ${API_BASE_URL}`);
            return;
        }

        // Execute a normal job
        const execRes = await fetch(`${API_BASE_URL}/api/v1/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: 'python3',
                files: [
                    {
                        name: 'main.py',
                        content: 'print("HEALTHY_RECOVERY_200")',
                    },
                ],
            }),
        });

        assert.equal(execRes.status, 200);
        const execData = (await execRes.json()) as any;
        assert.equal(execData.status, 'OK');
        assert.equal(execData.run.stdout.trim(), 'HEALTHY_RECOVERY_200');

        // Check health endpoint telemetry
        const healthRes = await fetch(`${API_BASE_URL}/health`);
        assert.equal(healthRes.status, 200);
        const healthData = (await healthRes.json()) as any;

        assert.equal(healthData.status, 'ok');
        assert.equal(healthData.pool.activeJobs, 0, 'No dangling active jobs');
        assert.equal(healthData.pool.quarantinedBoxes, 0, 'No unrecoverable quarantined boxes');
        assert.ok(healthData.pool.availableBoxes > 0, 'Pool has available capacity');
    });
});
