import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { getLanguageManifest } from '../registry/index.js';

const LANGUAGES_DIR = '/app/languages';

export async function installCommand(langArg: string) {
  // Support version targeting (e.g., python3@3.10.13)
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

  let spinner = logger.spinner('Preparing staging area...');

  try {
    // Prepare Staging
    if (!fs.existsSync(LANGUAGES_DIR)) fs.mkdirSync(LANGUAGES_DIR, { recursive: true });
    execSync(`rm -rf ${buildDir} && mkdir -p ${buildDir}`);
    spinner.succeed('Staging area prepared.');

    // Download
    spinner = logger.spinner('Downloading standalone binaries...');
    execSync(`wget -q -O ${archivePath} ${config.url}`);
    spinner.succeed('Binaries downloaded.');

    // Extract
    spinner = logger.spinner('Extracting archive...');
    const isXZ = config.url.endsWith('.xz');
    execSync(`tar -x${isXZ ? 'J' : 'z'}f ${archivePath} -C ${buildDir}`);
    spinner.succeed('Archive extracted.');

    // Secure
    spinner = logger.spinner('Applying strict sandbox permissions...');
    execSync(`chmod -R 755 ${buildDir}/${config.extractFolder}`);
    spinner.succeed('Execution permissions locked.');

    // Compile Virtual Disk
    spinner = logger.spinner('Compiling highly efficient SquashFS virtual disk...');
    const sqshFile = path.join(LANGUAGES_DIR, `${lang}.sqsh`);
    if (fs.existsSync(sqshFile)) fs.unlinkSync(sqshFile);

    // stdio: 'ignore' to prevent spamming terminal
    execSync(`mksquashfs ${buildDir}/${config.extractFolder} ${sqshFile} -comp xz -b 1048576`, {
      stdio: 'ignore',
    });
    spinner.succeed('Virtual disk compiled.');

    // Write Engine Metadata
    spinner = logger.spinner('Writing core engine routing metadata...');
    const metaPayload = { language: lang, executable: config.executable, version: version };
    fs.writeFileSync(
      path.join(LANGUAGES_DIR, `${lang}.json`),
      JSON.stringify(metaPayload, null, 2)
    );
    spinner.succeed('Routing map updated.');

    console.log('\n' + logger.pc.green('🎉 Successfully installed! Engine is ready to execute.'));
  } catch (error: any) {
    spinner.fail(`Installation failed: ${error.message}`);
  } finally {
    // Cleanup
    execSync(`rm -rf ${buildDir}`);
  }
}
