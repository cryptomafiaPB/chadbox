#!/usr/bin/env node
import { Command } from 'commander';
import { installCommand } from './commands/install.js';
import { uninstallCommand } from './commands/uninstall.js';
import { listCommand } from './commands/list.js';
import { infoCommand } from './commands/info.js';
import { healthCommand } from './commands/health.js';
import { pruneCommand } from './commands/prune.js';

const program = new Command();

program.name('chad').description('Chadbox DevTools').version('1.0.0');

program
    .command('install <language>')
    .description('Download and compile a language')
    .action(installCommand);
program
    .command('uninstall <language>')
    .description('Remove an installed language')
    .action(uninstallCommand);
program.command('list').description('List available and installed languages').action(listCommand);
program
    .command('info <language>')
    .description('Show deep diagnostics for an installed language')
    .action(infoCommand);
program
    .command('health')
    .description('Check kernel, isolate, and system requirements')
    .action(healthCommand);
program
    .command('prune')
    .description('Force clean zombie mounts and temp files')
    .action(pruneCommand);

if (!process.argv.slice(2).length) {
    program.outputHelp();
    process.exit(0);
}

program.parse(process.argv);
