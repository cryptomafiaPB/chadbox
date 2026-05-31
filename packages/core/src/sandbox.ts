import { exec, spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import type { StageResult } from '@chadbox/shared';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SandboxConfig {
    boxId: number;
    timeLimit: number;
    memoryLimit: number;
    mounts?: { dest: string; src: string }[];
}

export class Sandbox {
    private config: SandboxConfig;
    private boxPath: string = '';

    constructor(config: SandboxConfig) {
        this.config = config;
    }

    // Async Init
    public async init(): Promise<string> {
        try {
            const { stdout } = await execAsync(`isolate --init --cg --box-id=${this.config.boxId}`);
            this.boxPath = stdout.trim();
            return this.boxPath;
        } catch (error: any) {
            throw new Error(`Failed to init sandbox: ${error.message}`);
        }
    }

    public async writeCode(filename: string, code: string): Promise<void> {
        if (!this.boxPath) throw new Error('Sandbox not initialized');
        const fullPath = path.join(this.boxPath, 'box', filename);
        await fs.writeFile(fullPath, code);
    }

    public async run(executable: string, args: string[] = []): Promise<StageResult> {
        if (!this.boxPath) throw new Error('Sandbox not initialized');

        const metaFile = path.join(this.boxPath, 'meta.txt');
        const stdoutFile = path.join(this.boxPath, 'box', 'stdout.txt');
        const stderrFile = path.join(this.boxPath, 'box', 'stderr.txt');

        const isolateArgs = [
            '--run',
            '--cg',
            `--box-id=${this.config.boxId}`,
            `--time=${this.config.timeLimit}`,
            `--wall-time=${this.config.timeLimit + 1}`,
            `--cg-mem=${this.config.memoryLimit}`,
            `--processes=64`,
            `--fsize=10240`,
            `--silent`,
            `--stdout=stdout.txt`,
            `--stderr=stderr.txt`,
            `--env=HOME=/box`,
            `--env=PATH=/bin:/usr/bin:/usr/local/bin`,
            `--meta=${metaFile}`,
        ];

        if (this.config.mounts) {
            for (const m of this.config.mounts) {
                isolateArgs.push(`--dir=${m.dest}=${m.src}`);
            }
        }

        isolateArgs.push('--', executable, ...args);

        // Capture exact Exit Code
        const exitCode = await new Promise<number | null>((resolve) => {
            const proc = spawn('isolate', isolateArgs, { stdio: 'ignore' });

            const timeout = setTimeout(
                () => {
                    try {
                        proc.kill('SIGKILL');
                    } catch (e) {
                        // Ignore if process is already dead
                    }
                },
                (this.config.timeLimit + 2) * 1000
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
                return buffer.length > 65535
                    ? buffer.toString('utf8', 0, 65535) + '\n...[Output Truncated]'
                    : buffer.toString('utf8');
            } catch {
                return '';
            }
        };

        const finalStdout = await safeRead(stdoutFile);
        const finalStderr = await safeRead(stderrFile);

        return await this.parseMetaFile(metaFile, finalStdout || '', finalStderr || '', exitCode);
    }

    // Async Cleanup
    public async cleanup(): Promise<void> {
        try {
            await execAsync(`isolate --cleanup --cg --box-id=${this.config.boxId}`);
        } catch (e) {
            // Ignore cleanup errors
            console.warn(
                `Failed to cleanup sandbox: ${e instanceof Error ? e.message : String(e)}`
            );
        }
    }

    private async parseMetaFile(
        metaPath: string,
        stdout: string,
        stderr: string,
        exitCode: number | null
    ): Promise<StageResult> {
        let memory = 0;
        let time = 0;
        let oom = false;
        let timeout = false;

        try {
            const lines = (await fs.readFile(metaPath, 'utf-8')).split('\n');
            for (const line of lines) {
                if (line.startsWith('cg-mem:')) memory = parseInt(line.split(':')[1] || '0');
                if (line.startsWith('time:')) time = parseFloat(line.split(':')[1] || '0');
                if (line.startsWith('status: TO')) timeout = true;
                if (line.startsWith('status: SG') || line.includes('cg-oom-killed: 1')) oom = true;

                if (line.startsWith('message:')) {
                    const msg = line.toLowerCase();
                    if (msg.includes('time limit')) timeout = true;
                    if (msg.includes('memory limit')) oom = true;
                }
            }

            if (memory >= this.config.memoryLimit) oom = true;
            if (time >= this.config.timeLimit) timeout = true;
        } catch (e) {
            console.warn(`Could not parse meta file.`);
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
