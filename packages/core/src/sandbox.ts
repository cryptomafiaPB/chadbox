import { execSync, spawnSync } from 'child_process';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import type { StageResult } from '@chadbox/shared';

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

  public init(): string {
    const result = spawnSync('isolate', ['--init', '--cg', `--box-id=${this.config.boxId}`], {
      encoding: 'utf8',
    });
    if (result.status !== 0) throw new Error(`Failed to init sandbox: ${result.stderr}`);
    this.boxPath = result.stdout.trim();
    return this.boxPath;
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

      `--fsize=10240`, // cap max file write to 10MB
      `--silent`, // suppress isolate's internal diagnostic stderr

      `--stdout=stdout.txt`,
      `--stderr=stderr.txt`,

      `--env=HOME=/box`,
      `--env=PATH=/bin:/usr/bin:/usr/local/bin`,

      `--meta=${metaFile}`,
    ];

    const activeHostMounts: string[] = []; // Track mounts for cleanup

    try {
      if (this.config.mounts) {
        for (const [i, m] of this.config.mounts.entries()) {
          // Create a temporary staging directory on the host
          const hostMountPoint = `/tmp/chadbox_${this.config.boxId}_${i}`;
          if (!existsSync(hostMountPoint)) mkdirSync(hostMountPoint, { recursive: true });

          // loop-mount the .sqsh FILE onto the HOST directory
          // allows the Linux kernel to treat the compressed file as a real folder
          execSync(`mount -o loop,ro,exec,nosuid,nodev ${m.src} ${hostMountPoint}`);
          activeHostMounts.push(hostMountPoint);

          // Tell isolate to bind-mount the HOST directory to the SANDBOX directory
          isolateArgs.push(`--dir=${m.dest}=${hostMountPoint}`);
        }
      }

      isolateArgs.push('--', executable, ...args);
      const result = spawnSync('isolate', isolateArgs, {
        encoding: 'utf8',
        timeout: (this.config.timeLimit + 2) * 1000,
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

      return await this.parseMetaFile(
        metaFile,
        finalStdout || '',
        finalStderr || '',
        result.status
      );
    } finally {
      // DEFENSIVE CLEANUP: Guaranteed unmounts
      for (const mp of activeHostMounts) {
        try {
          execSync(`umount -l ${mp}`, { stdio: 'ignore' });
          execSync(`rm -rf ${mp}`, { stdio: 'ignore' });
        } catch (e) {
          // Silently ignore if the kernel already cleaned it up
        }
      }
    }
  }

  public cleanup(): void {
    spawnSync('isolate', ['--cleanup', '--cg', `--box-id=${this.config.boxId}`]);
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

        // Advanced Cgroups v2 parsing
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
