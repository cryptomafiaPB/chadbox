import fs from 'fs';
import path from 'path';
import Table from 'cli-table3';
import bytes from 'bytes';
import { logger } from '../utils/logger.js';
import { getLanguageManifest } from '../registry/index.js';

const LANGUAGES_DIR = '/app/languages';
const REGISTRY_PATH = path.join(process.cwd(), 'src/registry/manifest.json');

export async function listCommand() {
    const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));

    const table = new Table({
        head: [
            logger.pc.cyan('Language'),
            logger.pc.cyan('Version'),
            logger.pc.cyan('Status'),
            logger.pc.cyan('Disk Size'),
        ],
        style: { head: [], border: [] }, // Clean borders
    });

    for (const [langId, meta] of Object.entries(registry) as [string, any][]) {
        const defaultVersion = meta.default_version;
        const sqshPath = path.join(LANGUAGES_DIR, `${langId}.sqsh`);

        let status = logger.pc.gray('Available');
        let size = '-';

        if (fs.existsSync(sqshPath)) {
            status = logger.pc.green('✔ Installed');
            size = bytes(fs.statSync(sqshPath).size) || '-';
        }

        table.push([logger.pc.bold(meta.name), defaultVersion, status, size]);
    }

    console.log(`\n📦 ${logger.pc.bold('Chadbox Language Registry')}`);
    console.log(table.toString());
    console.log('');
}
