import { exec, spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import type { StageResult } from '@chadbox/shared';
import { config } from '@chadbox/shared';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SandboxConfig {
    boxId: number;
    mounts?: { dest: string; src: string }[];
}

export interface RunOptions {
    stage: 'compile' | 'run';
    timeLimit: number;
    memoryLimit: number;
    processes?: number;
    fsize?: number;
    env?: Record<string, string>; // Support dynamic environment
}

export type SandboxState = 'UNINITIALIZED' | 'INITIALIZED' | 'RUNNING' | 'CLEANED' | 'FAILED';

export interface CleanupResult {
    success: boolean;
    error?: string;
}

export class Sandbox {
    private config: SandboxConfig;
    private boxPath: string = '';
    private state: SandboxState = 'UNINITIALIZED';

    constructor(config: SandboxConfig) {
        this.config = config;
    }

    public getState(): SandboxState {
        return this.state;
    }

    public getBoxPath(): string {
        return this.boxPath;
    }

    // Async Init with Self-Healing Recovery
    public async init(): Promise<string> {
        if (this.state === 'INITIALIZED' && this.boxPath) {
            return this.boxPath;
        }

        try {
            const { stdout } = await execAsync(`isolate --init --cg --box-id=${this.config.boxId}`);
            this.boxPath = stdout.trim();
            this.state = 'INITIALIZED';
            return this.boxPath;
        } catch (error: any) {
            // Self-healing: if previous crash left an uncleaned box/cgroup, force cleanup and retry once
            try {
                await Sandbox.forceCleanup(this.config.boxId);
                const { stdout } = await execAsync(
                    `isolate --init --cg --box-id=${this.config.boxId}`
                );
                this.boxPath = stdout.trim();
                this.state = 'INITIALIZED';
                return this.boxPath;
            } catch (retryError: any) {
                this.state = 'FAILED';
                throw new Error(
                    `Failed to init sandbox ${this.config.boxId}: ${retryError.message || error.message}`
                );
            }
        }
    }

    public async writeCode(filename: string, code: string | Buffer): Promise<void> {
        if (!this.boxPath || (this.state !== 'INITIALIZED' && this.state !== 'RUNNING')) {
            throw new Error('Sandbox not initialized');
        }

        // Strict null-byte and malformed path checks
        if (filename.includes('\0')) {
            throw new Error('Invalid filename: null bytes are forbidden');
        }

        // Canonical boundary resolution
        const boxDir = path.resolve(this.boxPath, 'box');
        const targetPath = path.resolve(boxDir, filename);

        // Security Barrier: Strictly verify path does not escape sandbox box directory
        const relative = path.relative(boxDir, targetPath);
        if (relative.startsWith('..') || path.isAbsolute(relative) || relative === '') {
            throw new Error(`Path traversal attempt blocked: "${filename}"`);
        }

        // Ensure safe creation of subdirectories (e.g. src/app.py) inside the box
        const parentDir = path.dirname(targetPath);
        if (parentDir !== boxDir) {
            await fs.mkdir(parentDir, { recursive: true });
        }

        await fs.writeFile(targetPath, code);
    }

    public async run(commandArr: string[], options: RunOptions): Promise<StageResult> {
        if (!this.boxPath) throw new Error('Sandbox not initialized');

        // Segregate compile vs run output
        const metaFile = path.join(this.boxPath, `${options.stage}_meta.txt`);
        const stdoutFile = path.join(this.boxPath, 'box', `${options.stage}_stdout.txt`);
        const stderrFile = path.join(this.boxPath, 'box', `${options.stage}_stderr.txt`);

        // Extract executable directory for PATH augmentation
        const binDir = path.dirname(commandArr[0] ?? '');

        const defaultProcesses =
            options.stage === 'compile'
                ? config.sandbox.maxProcessesCompile
                : config.sandbox.maxProcessesRun;
        const defaultFsize =
            options.stage === 'compile'
                ? config.sandbox.maxFsizeCompileKb
                : config.sandbox.maxFsizeRunKb;

        const isolateArgs = [
            '--run',
            '--cg',
            `--box-id=${this.config.boxId}`,
            `--time=${options.timeLimit}`,
            `--wall-time=${options.timeLimit + 1}`,
            `--cg-mem=${options.memoryLimit}`,
            `--processes=${options.processes || defaultProcesses}`,
            `--fsize=${options.fsize || defaultFsize}`,
            `--silent`,
            `--stdin=stdin.txt`,
            `--stdout=${options.stage}_stdout.txt`,
            `--stderr=${options.stage}_stderr.txt`,
            `--dir=/etc/alternatives=/etc/alternatives`,
            `--env=HOME=/box`,
            `--env=PATH=${binDir}:/bin:/usr/bin:/usr/local/bin`, // Dynamic PATH injection
            `--meta=${metaFile}`,
        ];

        if (options.env) {
            for (const [key, val] of Object.entries(options.env)) {
                isolateArgs.push(`--env=${key}=${val}`);
            }
        }

        if (this.config.mounts) {
            for (const m of this.config.mounts) {
                isolateArgs.push(`--dir=${m.dest}=${m.src}`);
            }
        }

        isolateArgs.push('--', ...commandArr);

        // Capture exact Exit Code
        const exitCode = await new Promise<number | null>((resolve) => {
            const proc = spawn('isolate', isolateArgs, { stdio: 'ignore' });

            const timeout = setTimeout(
                () => {
                    try {
                        proc.kill('SIGKILL');
                    } catch (e) {
                        // Ignore
                    }
                },
                (options.timeLimit + 2) * 1000
            );

            proc.on('close', (code) => {
                clearTimeout(timeout);
                resolve(code);
            });

            proc.on('error', () => {
                clearTimeout(timeout);
                resolve(null);
            });
        });

        const safeRead = async (file: string) => {
            try {
                const buffer = await fs.readFile(file);
                const maxOutput = config.sandbox.maxOutputBytes;
                return buffer.length > maxOutput
                    ? buffer.toString('utf8', 0, maxOutput) + '\n...[Output Truncated]'
                    : buffer.toString('utf8');
            } catch {
                return '';
            }
        };

        const finalStdout = await safeRead(stdoutFile);
        const finalStderr = await safeRead(stderrFile);
        this.state = 'INITIALIZED';

        return await this.parseMetaFile(
            metaFile,
            finalStdout,
            finalStderr,
            exitCode,
            options.memoryLimit,
            options.timeLimit
        );
    }

    // Multi-stage Resilient Cleanup
    public async cleanup(): Promise<CleanupResult> {
        if (this.state === 'UNINITIALIZED') {
            return { success: true };
        }
        if (this.state === 'CLEANED') {
            return { success: true };
        }

        try {
            await execAsync(`isolate --cleanup --cg --box-id=${this.config.boxId}`);
            this.state = 'CLEANED';
            this.boxPath = '';
            return { success: true };
        } catch (e) {
            // Stage 2: Fallback Force Cleanup
            try {
                await Sandbox.forceCleanup(this.config.boxId);
                this.state = 'CLEANED';
                this.boxPath = '';
                return { success: true };
            } catch (fallbackErr: any) {
                this.state = 'FAILED';
                const errMessage =
                    fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
                console.warn(`Failed to cleanup sandbox ${this.config.boxId}: ${errMessage}`);
                return { success: false, error: errMessage };
            }
        }
    }

    /**
     * Forcefully sweeps a sandbox's cgroup processes and runs isolate --cleanup.
     */
    public static async forceCleanup(boxId: number): Promise<void> {
        const cgroupProcsPath = `/sys/fs/cgroup/isolate/box-${boxId}/cgroup.procs`;
        try {
            const content = await fs.readFile(cgroupProcsPath, 'utf8');
            const pids = content.split('\n').filter(Boolean);
            for (const pidStr of pids) {
                const pid = parseInt(pidStr, 10);
                if (!isNaN(pid) && pid > 0) {
                    try {
                        process.kill(pid, 'SIGKILL');
                    } catch {
                        // Process already terminated or inaccessible
                    }
                }
            }
        } catch {
            // Cgroup directory does not exist or unreadable
        }

        await execAsync(`isolate --cleanup --cg --box-id=${boxId}`);
    }

    /**
     * Managed session wrapper: handles sandbox lifecycle and guarantees cleanup.
     */
    public static async runScoped<T>(
        config: SandboxConfig,
        action: (sandbox: Sandbox) => Promise<T>
    ): Promise<T> {
        const sandbox = new Sandbox(config);
        await sandbox.init();
        try {
            return await action(sandbox);
        } finally {
            await sandbox.cleanup();
        }
    }

    private async parseMetaFile(
        metaPath: string,
        stdout: string,
        stderr: string,
        exitCode: number | null,
        memLimit?: number,
        timeLimit?: number
    ): Promise<StageResult> {
        let memory = 0;
        let time = 0;
        let oom = false;
        let timeout = false;
        let exitSig: number | null = null;
        try {
            const lines = (await fs.readFile(metaPath, 'utf-8')).split('\n');
            for (const rawLine of lines) {
                const line = rawLine.trim();
                if (line.startsWith('cg-mem:')) {
                    memory = parseInt(line.slice(7).trim() || '0', 10);
                }
                if (line.startsWith('time:')) {
                    time = parseFloat(line.slice(5).trim() || '0');
                }
                if (line.startsWith('exitsig:')) {
                    exitSig = parseInt(line.slice(8).trim() || '0', 10);
                }
                if (line.startsWith('status:TO') || line.startsWith('status: TO')) {
                    timeout = true;
                }
                if (
                    line.includes('cg-oom-killed:1') ||
                    line.includes('cg-oom-killed: 1') ||
                    (exitSig === 9 &&
                        (line.startsWith('status:SG') || line.startsWith('status: SG')))
                ) {
                    oom = true;
                }
                if (line.startsWith('message:')) {
                    const msg = line.toLowerCase();
                    if (msg.includes('time limit')) timeout = true;
                    if (msg.includes('memory limit') || msg.includes('oom')) oom = true;
                }
            }
            if (memLimit && memory >= memLimit && exitCode !== 0) {
                oom = true;
            }
            if (timeLimit && time >= timeLimit && exitCode !== 0) {
                timeout = true;
            }
        } catch (e) {
            // Ignore
        }

        return {
            stdout,
            stderr,
            code: exitCode,
            signal: oom ? 'SIGKILL (OOM)' : timeout ? 'SIGKILL (Timeout)' : null,
            time,
            memory,
            output_limit_exceeded: false,
        };
    }
}
