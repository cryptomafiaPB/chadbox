import { execSync } from 'child_process';
import fs from 'fs';
import Table from 'cli-table3';
import { logger } from '../utils/logger.js';

export async function healthCommand() {
    const table = new Table({
        head: [logger.pc.cyan('Component'), logger.pc.cyan('Status'), logger.pc.cyan('Details')],
    });

    const checkCommand = (cmd: string) => {
        try {
            return execSync(cmd, { stdio: 'pipe' }).toString().trim().split('\n')[0];
        } catch {
            return null;
        }
    };

    // Check Isolate
    const isolateVer = checkCommand('isolate --version');
    table.push([
        'Isolate Core',
        isolateVer ? logger.pc.green('✔ OK') : logger.pc.red('✖ Missing'),
        isolateVer || '-',
    ]);

    // Check SquashFS
    const sqshVer = checkCommand('mksquashfs -version');
    table.push([
        'SquashFS Tools',
        sqshVer ? logger.pc.green('✔ OK') : logger.pc.red('✖ Missing'),
        sqshVer ? 'Installed' : '-',
    ]);

    // Check Cgroups v2
    const cgroupsOk = fs.existsSync('/sys/fs/cgroup/cgroup.controllers');
    table.push([
        'Cgroups v2',
        cgroupsOk ? logger.pc.green('✔ Active') : logger.pc.red('✖ Inactive'),
        cgroupsOk ? '/sys/fs/cgroup' : 'Kernel mismatch',
    ]);

    console.log(`\n🩺 ${logger.pc.bold('Chadbox System Health')}`);
    console.log(table.toString());
    console.log('');
}
