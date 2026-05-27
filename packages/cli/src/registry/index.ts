import fs from 'fs';
import path from 'path';

export function getLanguageManifest(lang: string) {
  //   const manifestPath = path.join(process.cwd(), 'src/registry/manifest.json');
  const manifestPath = path.join(__dirname, 'manifest.json');
  try {
    const registry = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return registry[lang] || null;
  } catch (e) {
    throw new Error('Could not load registry manifest.');
  }
}
