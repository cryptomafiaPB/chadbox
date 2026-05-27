import fs from 'fs';
import path from 'path';
import bytes from 'bytes';
import { logger } from '../utils/logger.js';

const LANGUAGES_DIR = '/app/languages';

export async function infoCommand(lang: string) {
    const jsonPath = path.join(LANGUAGES_DIR, `${lang}.json`);
    const sqshPath = path.join(LANGUAGES_DIR, `${lang}.sqsh`);

    if (!fs.existsSync(jsonPath) || !fs.existsSync(sqshPath)) {
        logger.error(
            `Language '${lang}' is not installed. Run 'chad install ${lang}' to install language.`
        );
        return;
    }

    const meta = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const stats = fs.statSync(sqshPath);

    console.log(`\n🔍 ${logger.pc.bold('Environment Info:')} ${logger.pc.cyan(lang)}`);
    console.log(`  ├─ ${logger.pc.gray('Version:')}    ${meta.version}`);
    console.log(`  ├─ ${logger.pc.gray('Target:')}     ${meta.executable}`);
    console.log(`  ├─ ${logger.pc.gray('Disk Size:')}  ${bytes(stats.size) || '-'}`);
    console.log(`  └─ ${logger.pc.gray('Mount:')}      ${sqshPath}\n`);
}
