import { execSync } from 'child_process';
import fs from 'fs';
import { logger } from '../utils/logger.js';

export async function pruneCommand() {
    const spinner = logger.spinner('Scanning for zombie mounts and dangling build files...');
    let mountsCleared = 0;
    let filesCleared = 0;

    try {
        // Force unmount any stranded Chadbox mounts
        const mounts = execSync('mount | grep /tmp/chadbox_ || true').toString().trim().split('\n');
        for (const mount of mounts) {
            if (!mount) continue;
            const mountPoint = mount.split(' ')[2];
            try {
                execSync(`umount -l ${mountPoint}`, { stdio: 'ignore' });
                execSync(`rm -rf ${mountPoint}`, { stdio: 'ignore' });
                mountsCleared++;
            } catch (e) {
                // Silently ignore if the kernel already cleaned it up
                logger.warn(`Failed to unmount ${mountPoint}`);
            }
        }

        // Clean failed staging builds
        const tmpFiles = fs.readdirSync('/tmp');
        for (const file of tmpFiles) {
            if (file.startsWith('chad_build_')) {
                execSync(`rm -rf /tmp/${file}`, { stdio: 'ignore' });
                filesCleared++;
            }
        }

        spinner.succeed(
            `Prune complete. Unmounted ${mountsCleared} zombies, deleted ${filesCleared} temp folders.`
        );
    } catch (err: any) {
        spinner.fail(`Prune failed: ${err.message}`);
    }
}
