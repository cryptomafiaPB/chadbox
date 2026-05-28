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

    // Check Disk Space
    // const diskInfo = checkCommand('df -h /app/languages | tail -1');
    // table.push([
    //     'Disk Space (/app/languages)',
    //     diskInfo ? logger.pc.green('✔ Accessible') : logger.pc.red('✖ Unavailable'),
    //     diskInfo || '-',
    // ]);

    // Check Permissions
    let permStatus = logger.pc.green('✔ OK');
    try {
        fs.accessSync('/app/languages', fs.constants.W_OK);
    } catch {
        permStatus = logger.pc.red('✖ No Write Access');
    }
    table.push(['Permissions', permStatus, '/app/languages']);

    // Check wget
    const wgetVer = checkCommand('wget --version');
    table.push([
        'wget',
        wgetVer ? logger.pc.green('✔ OK') : logger.pc.red('✖ Missing'),
        wgetVer ? 'Installed' : '-',
    ]);

    // Check tar
    const tarVer = checkCommand('tar --version');
    table.push([
        'tar',
        tarVer ? logger.pc.green('✔ OK') : logger.pc.red('✖ Missing'),
        tarVer ? 'Installed' : '-',
    ]);

    // Check xz
    const xzVer = checkCommand('xz --version');
    table.push([
        'xz',
        xzVer ? logger.pc.green('✔ OK') : logger.pc.red('✖ Missing'),
        xzVer ? 'Installed' : '-',
    ]);

    // Check zstd
    const zstdVer = checkCommand('zstd --version');
    table.push([
        'zstd',
        zstdVer ? logger.pc.green('✔ OK') : logger.pc.red('✖ Missing'),
        zstdVer ? 'Installed' : '-',
    ]);

    console.log(`\n🩺 ${logger.pc.bold('Chadbox System Health')}`);
    console.log(table.toString());
    console.log('');
}
