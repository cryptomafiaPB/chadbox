import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

const LANGUAGES_DIR = '/app/languages';

export async function uninstallCommand(langArg: string) {
    const [lang] = langArg.split('@'); // Ignore version for uninstall currently
    const sqshPath = path.join(LANGUAGES_DIR, `${lang}.sqsh`);
    const jsonPath = path.join(LANGUAGES_DIR, `${lang}.json`);

    if (!fs.existsSync(sqshPath)) {
        logger.warn(`Language '${lang}' is not currently installed.`);
        return;
    }

    const spinner = logger.spinner(`Uninstalling ${lang}...`);
    try {
        if (fs.existsSync(sqshPath)) fs.unlinkSync(sqshPath);
        if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
        spinner.succeed(`Successfully uninstalled ${lang}. Space reclaimed.`);
    } catch (err: any) {
        spinner.fail(`Failed to uninstall: ${err.message}`);
    }
}
