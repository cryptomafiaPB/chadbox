#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import ora from 'ora';

const program = new Command();
const LANG_DIR = '/app/languages';

// Replace with actual registry URL when available
const REGISTRY_URL = 'https://mock-registry.chadbox.io/v1';

// Utility

const ensureDir = () => {
  if (!fs.existsSync(LANG_DIR)) {
    fs.mkdirSync(LANG_DIR, { recursive: true });
  }
};

// Memory-Safe File Downloader
const downloadFile = async (url: string, dest: string) => {
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`Failed to fetch: ${response.statusText}`);

  const fileStream = fs.createWriteStream(dest);

  // @ts-expect-error - Node.js ReadableStream vs Web ReadableStream type mismatch
  await finished(Readable.fromWeb(response.body).pipe(fileStream)); // Stream directly to disk without buffering in memory
};

program
  .name('chad')
  .description('Chadbox Package Manager - Zero-Extraction SquashFS Toolchain')
  .version('1.0.0');

program
  .command('install <language>')
  .description('Download and install a compressed .sqsh language environment')
  .action(async (language) => {
    ensureDir();
    const spinner = ora(`Installing ${language}...`).start();

    try {
      // 1. Define paths
      const sqshPath = path.join(LANG_DIR, `${language}.sqsh`);
      const metaPath = path.join(LANG_DIR, `${language}.json`);

      spinner.text = `Downloading ${language}.sqsh (Zero-Extraction Environment)...`;

      // MOCK BEHAVIOR: Since you don't have a real S3 bucket yet, we will just create a dummy file
      // In production, you will uncomment the downloadFile lines:

      // await downloadFile(`${REGISTRY_URL}/${language}.sqsh`, sqshPath);
      fs.writeFileSync(sqshPath, 'MOCK_SQUASHFS_BINARY_DATA'); // Mock download

      spinner.text = `Generating metadata...`;
      // await downloadFile(`${REGISTRY_URL}/${language}.json`, metaPath);
      fs.writeFileSync(
        metaPath,
        JSON.stringify(
          {
            language: language,
            executable: `/usr/bin/${language}`, // Where isolate will look inside the sandbox
            version: 'latest',
          },
          null,
          2
        )
      );

      spinner.succeed(`Successfully installed ${language} into ${LANG_DIR}`);
    } catch (error: any) {
      spinner.fail(`Installation failed: ${error.message}`);
    }
  });

program
  .command('list')
  .description('List all locally installed language environments')
  .action(() => {
    ensureDir();
    const files = fs.readdirSync(LANG_DIR);
    const languages = files.filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));

    if (languages.length === 0) {
      console.log('No languages installed. Run `chad install <language>`');
      return;
    }

    console.log('\n📦 Installed Environments:');
    languages.forEach((lang) => console.log(` - ${lang} (Ready for instant mounting)`));
    console.log('');
  });

program.parse();
