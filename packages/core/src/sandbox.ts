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

    const isolateArgs = [
      '--run',
      '--cg',
      `--box-id=${this.config.boxId}`,
      `--time=${this.config.timeLimit}`,
      `--wall-time=${this.config.timeLimit + 1}`,
      `--cg-mem=${this.config.memoryLimit}`,
      `--processes=64`,
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
          execSync(`mount -o loop,ro,exec ${m.src} ${hostMountPoint}`);
          activeHostMounts.push(hostMountPoint);

          // Tell isolate to bind-mount the HOST directory to the SANDBOX directory
          isolateArgs.push(`--dir=${m.dest}=${hostMountPoint}`);
        }
      }

      isolateArgs.push('--', executable, ...args);
      const result = spawnSync('isolate', isolateArgs, { encoding: 'utf8' });

      return await this.parseMetaFile(
        metaFile,
        result.stdout || '',
        result.stderr || '',
        result.status
      );
    } finally {
      // DEFENSIVE CLEANUP: Guarantee unmounts even if execution crashes
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
        if (line.includes('status: TO')) timeout = true;
        if (line.includes('status: SG') || line.includes('cg-oom-killed: 1')) oom = true;
      }
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
