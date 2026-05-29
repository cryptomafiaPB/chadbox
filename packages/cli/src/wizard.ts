import { intro, outro, select, isCancel, cancel } from '@clack/prompts';
import pc from 'picocolors';
import fs from 'fs';
import path from 'path';
import { installCommand } from './commands/install.js';
import { uninstallCommand } from './commands/uninstall.js';
import { listCommand } from './commands/list.js';
import { healthCommand } from './commands/health.js';
import { pruneCommand } from './commands/prune.js';
import { benchmarkCommand } from './commands/benchmark.js';

export async function startWizard() {
    console.clear();
    intro(pc.bgCyan(pc.black(' ⚡ CHADBOX DEVTOOLS ')));

    const action = await select({
        message: 'What would you like to do?',
        options: [
            { value: 'install', label: '📦 Install Environment' },
            { value: 'uninstall', label: '🗑️  Uninstall Environment' },
            { value: 'list', label: '📊 View Registry Matrix' },
            { value: 'benchmark', label: '🔥 Run Stress Test Benchmark' },
            { value: 'health', label: '🩺 System Health Check' },
            { value: 'prune', label: '🧹 Prune Zombie Mounts' },
        ],
    });

    if (isCancel(action)) {
        cancel('Operation cancelled.');
        return process.exit(0);
    }

    const manifestPath = path.join(process.cwd(), 'src/registry/manifest.json');
    const registry = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    if (action === 'install') {
        const lang = await select({
            message: 'Select an environment to securely install:',
            options: Object.keys(registry).map((key) => ({
                value: key,
                label: `${registry[key].name} (v${registry[key].default_version})`,
            })),
        });
        if (isCancel(lang)) return process.exit(0);
        await installCommand(lang as string);
    } else if (action === 'uninstall') {
        const installed = Object.keys(registry).filter((key) =>
            fs.existsSync(`/app/languages/${key}.sqsh`)
        );
        if (installed.length === 0) {
            console.log(pc.yellow('⚠ No environments currently installed.'));
            return process.exit(0);
        }
        const lang = await select({
            message: 'Select an environment to uninstall:',
            options: installed.map((key) => ({ value: key, label: registry[key].name })),
        });
        if (isCancel(lang)) return process.exit(0);
        await uninstallCommand(lang as string);
    } else if (action === 'list') await listCommand();
    else if (action === 'health') await healthCommand();
    else if (action === 'prune') await pruneCommand();
    else if (action === 'benchmark') {
        const lang = await select({
            message: 'Which environment should we stress test?',
            options: Object.keys(registry).map((key) => ({
                value: key,
                label: registry[key].name,
            })),
        });
        if (isCancel(lang)) return process.exit(0);
        await benchmarkCommand(lang as string, { concurrent: '50', total: '200' });
    }

    outro(pc.green('✔ Operations completed.'));
}
