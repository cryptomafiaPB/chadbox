import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export class KernelManager {
  static async bootstrapCgroups(): Promise<void> {
    console.log('⚙️ [KernelManager] Aggressively sculpting Cgroups v2...');

    try {
      const rootCgroup = '/sys/fs/cgroup';
      const initCgroup = path.join(rootCgroup, 'init');
      const isolateCgroup = path.join(rootCgroup, 'isolate');

      // Create a "holding pen" for the master processes
      execSync(`mkdir -p ${initCgroup}`);

      // Migrate all processes from root into the holding pen
      const pids = fs
        .readFileSync(path.join(rootCgroup, 'cgroup.procs'), 'utf8')
        .split('\n')
        .filter(Boolean);
      for (const pid of pids) {
        try {
          fs.writeFileSync(path.join(initCgroup, 'cgroup.procs'), pid);
        } catch (e) {
          /* Ignore kernel threads */
        }
      }

      // Dynamically read available kernel controllers (Bulletproof against different OS types)
      const available = fs
        .readFileSync(path.join(rootCgroup, 'cgroup.controllers'), 'utf8')
        .trim()
        .split(' ');
      const toEnable = available
        .filter((c) => ['cpu', 'memory', 'pids'].includes(c))
        .map((c) => `+${c}`)
        .join(' ');

      if (toEnable) {
        // Enable on root (passes to /isolate)
        try {
          fs.writeFileSync(path.join(rootCgroup, 'cgroup.subtree_control'), toEnable);
        } catch (e) {
          console.warn(
            '⚠️ [KernelManager] Failed to enable controllers on root cgroup. Attempting to continue...'
          );
        }

        // Create isolate root
        execSync(`mkdir -p ${isolateCgroup}`);

        try {
          fs.writeFileSync(path.join(isolateCgroup, 'cgroup.subtree_control'), toEnable);
        } catch (e) {
          console.warn(
            '⚠️ [KernelManager] Failed to enable controllers on isolate cgroup. Attempting to continue...'
          );
        }
      } else {
        execSync(`mkdir -p ${isolateCgroup}`);
      }

      // Rebuild the volatile /run directory for isolate's state tracker
      execSync('mkdir -p /run/isolate');
      execSync('chmod 777 /run/isolate');
      fs.writeFileSync('/run/isolate/cgroup', `${isolateCgroup}\n`);

      console.log(`✅ [KernelManager] Cgroup tree locked. Active limits: ${toEnable || 'None'}`);
    } catch (error: any) {
      console.error('❌ [KernelManager] FAILED to construct cgroup tree:', error.message);
      throw error;
    }
  }
}
