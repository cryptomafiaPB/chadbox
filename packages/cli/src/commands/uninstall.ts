import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { spinner } from '@clack/prompts';

const LANGUAGES_DIR = '/app/languages';

export async function uninstallCommand(langArg: string) {
    const [lang] = langArg.split('@');
    const sqshPath = path.join(LANGUAGES_DIR, `${lang}.sqsh`);
    const jsonPath = path.join(LANGUAGES_DIR, `${lang}.json`);

    if (!fs.existsSync(sqshPath)) {
        logger.warn(`Language '${lang}' is not currently installed.`);
        return;
    }

    const s = spinner();
    s.start(`Uninstalling ${logger.pc.cyan(lang)} and reclaiming space...`);

    try {
        // Force the live kernel to let go of the file before we delete it
        try {
            await fetch(`http://127.0.0.1:3000/api/v1/system/cache/${lang}`, { method: 'DELETE' });
        } catch (e) {
            // Ignore if server is offline
            s.message('Engine is currently offline. Cache will refresh on next boot.');
        }

        if (fs.existsSync(sqshPath)) fs.unlinkSync(sqshPath);
        if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);

        s.stop(`Successfully uninstalled ${logger.pc.cyan(lang)}. Space reclaimed.`);
    } catch (err: any) {
        s.stop(logger.pc.red(`Failed to uninstall: ${err.message}`));
    }
}
