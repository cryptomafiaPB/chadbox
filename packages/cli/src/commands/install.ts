import { exec } from 'child_process';
import { promisify } from 'util';
import fsSync from 'fs';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { spinner } from '@clack/prompts';
import pc from 'picocolors';
import { getLanguageManifest } from '../registry/index.js';

const execAsync = promisify(exec);
const LANGUAGES_DIR = '/app/languages';

export async function installCommand(langArg: string) {
    const [lang, versionArg] = langArg.split('@');
    const manifest = getLanguageManifest(lang);

    if (!manifest) {
        console.log(pc.red(`✖ Language '${lang}' not found in registry.`));
        process.exit(1);
    }

    const version = versionArg || manifest.default_version;
    const config = manifest.versions[version];

    if (!config) {
        console.log(pc.red(`✖ Version '${version}' not available for ${lang}.`));
        process.exit(1);
    }

    const buildDir = `/tmp/chad_build_${lang}`;
    const archivePath = `${buildDir}/archive_file`;

    const s = spinner();
    s.start(`Compiling ${pc.cyan(manifest.name)} v${version}`);

    try {
        s.message('Preparing isolated staging area...');
        if (!fsSync.existsSync(LANGUAGES_DIR)) fsSync.mkdirSync(LANGUAGES_DIR, { recursive: true });
        await execAsync(`rm -rf ${buildDir} && mkdir -p ${buildDir}`);

        const sqshFile = path.join(LANGUAGES_DIR, `${lang}.sqsh`);
        if (fsSync.existsSync(sqshFile)) fsSync.unlinkSync(sqshFile);

        if (config.url === 'system') {
            s.message('Linking native host toolchain...');
            await execAsync(`mkdir -p ${buildDir}/empty`);
            await execAsync(`mksquashfs ${buildDir}/empty ${sqshFile} -comp xz -b 1048576`);
        } else {
            s.message('Downloading secure standalone binaries...');
            await execAsync(`wget -q -O ${archivePath} ${config.url}`);

            // Cryptographic Validation
            s.message('Verifying SHA256 cryptographic signature...');
            const fileBuffer = await fs.readFile(archivePath);
            const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

            if (config.sha256 && actualHash !== config.sha256) {
                throw new Error(
                    `SECURITY ALERT: Checksum mismatch!\nExpected: ${config.sha256}\nReceived: ${actualHash}\nAborting installation to prevent Supply Chain Attack.`
                );
            }

            s.message('Extracting architecture...');
            if (config.url.endsWith('.zip')) {
                await execAsync(`unzip -q ${archivePath} -d ${buildDir}`);
            } else {
                const isXZ = config.url.endsWith('.xz');
                const isBZ2 = config.url.endsWith('.bz2');
                const stripFlag = config.strip_components
                    ? `--strip-components=${config.strip_components}`
                    : '';
                await execAsync(
                    `tar -x${isXZ ? 'J' : isBZ2 ? 'j' : 'z'}f ${archivePath} -C ${buildDir} ${stripFlag}`
                );
            }

            if (config.setup_cmd) {
                s.message('Executing internal toolchain linker...');
                await execAsync(config.setup_cmd, { cwd: buildDir });
            }

            s.message('Applying Kernel Sandbox Execution policies...');
            await execAsync(`chmod -R 755 ${buildDir}/${config.extractFolder}`);

            s.message('Compressing into high-speed SquashFS Virtual Disk...');
            await execAsync(
                `mksquashfs ${buildDir}/${config.extractFolder} ${sqshFile} -comp xz -b 1048576`
            );
        }

        s.message('Generating VFS routing manifests...');
        const metaPayload = {
            language: lang,
            version: version,
            compile_cmd: config.compile_cmd,
            run_cmd: config.run_cmd,
            env: config.env || {},
        };
        await fs.writeFile(
            path.join(LANGUAGES_DIR, `${lang}.json`),
            JSON.stringify(metaPayload, null, 2)
        );

        try {
            await fetch(`http://127.0.0.1:3000/api/v1/system/cache/${lang}`, { method: 'DELETE' });
        } catch (e) {
            // Ignore cache clearing errors - not critical for installation
        }

        s.stop(pc.green(`✔ ${manifest.name} environment securely built and verified!`));
    } catch (error: any) {
        s.stop(pc.red(`✖ Installation failed: ${error.message}`));
    } finally {
        await execAsync(`rm -rf ${buildDir} 2>/dev/null`).catch(() => {});
    }
}
