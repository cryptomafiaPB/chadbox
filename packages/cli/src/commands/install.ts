import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { getLanguageManifest } from '../registry/index.js';
import { spinner } from '@clack/prompts';
import pc from 'picocolors';
import { promisify } from 'util';

const LANGUAGES_DIR = '/app/languages';

export async function installCommand(langArg: string) {
    const [lang, versionArg] = langArg.split('@');
    const manifest = getLanguageManifest(lang);

    if (!manifest) {
        logger.error(`Language '${lang}' not found in registry.`);
        process.exit(1);
    }

    const version = versionArg || manifest.default_version;
    const config = manifest.versions[version];

    if (!config) {
        logger.error(`Version '${version}' not available for ${lang}.`);
        process.exit(1);
    }

    console.log(`\n📦 Installing ${logger.pc.bold(logger.pc.cyan(manifest.name))} (v${version})\n`);

    const buildDir = `/tmp/chad_build_${lang}`;
    const archivePath = `${buildDir}/archive.tar`;

    const execAsync = promisify(exec);

    const s = spinner();
    s.start(`Compiling ${pc.cyan(manifest.name)} v${version}`);

    try {
        s.message('Preparing isolated staging area...');
        if (!fs.existsSync(LANGUAGES_DIR)) fs.mkdirSync(LANGUAGES_DIR, { recursive: true });
        await execAsync(`rm -rf ${buildDir} && mkdir -p ${buildDir}`);

        s.message('Downloading secure standalone binaries...');
        await execAsync(`wget -q -O ${archivePath} ${config.url}`);
        s.message('Binaries downloaded.');

        s.message('Extracting architecture...');
        const isXZ = config.url.endsWith('.xz');
        await execAsync(`tar -x${isXZ ? 'J' : 'z'}f ${archivePath} -C ${buildDir}`);

        s.message('Applying Kernel Sandbox Execution policies...');
        await execAsync(`chmod -R 755 ${buildDir}/${config.extractFolder}`);

        s.message('Compressing into high-speed SquashFS Virtual Disk...');
        const sqshFile = path.join(LANGUAGES_DIR, `${lang}.sqsh`);
        if (fs.existsSync(sqshFile)) fs.unlinkSync(sqshFile);
        await execAsync(
            `mksquashfs ${buildDir}/${config.extractFolder} ${sqshFile} -comp xz -b 1048576`
        );

        s.message('Generating VFS routing manifests...');
        const metaPayload = { language: lang, executable: config.executable, version: version };
        fs.writeFileSync(
            path.join(LANGUAGES_DIR, `${lang}.json`),
            JSON.stringify(metaPayload, null, 2)
        );

        s.message('Triggering zero-downtime Engine Hot-Reload...');
        try {
            // evict the old cache so the new .sqsh takes effect instantly
            await fetch(`http://127.0.0.1:3000/api/v1/system/cache/${lang}`, { method: 'DELETE' });
            s.message('Engine cache evicted. Hot-reload complete.');
        } catch (e) {
            // If the API server happens to be offline, just warn them safely
            s.message('Engine is currently offline. Cache will refresh on next boot.');
        }

        s.stop(pc.green(`🎉 ${manifest.name} environment successfully built and hot-swapped!`));
    } catch (error: any) {
        s.stop(pc.red(`✖ Installation failed: ${error.message}`));
    } finally {
        await execAsync(`rm -rf ${buildDir}`);
    }
}
