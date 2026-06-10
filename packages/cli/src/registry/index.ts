import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyManifestSignature } from './signature.js';

const REGISTRY_DIRECTORIES = [
    path.join(process.cwd(), 'src/registry'),
    path.join(process.cwd(), 'dist/registry'),
    path.dirname(fileURLToPath(import.meta.url)),
];

function readRegistryAsset(fileName: string): string {
    for (const registryDirectory of REGISTRY_DIRECTORIES) {
        const assetPath = path.join(registryDirectory, fileName);

        if (fs.existsSync(assetPath)) {
            return fs.readFileSync(assetPath, 'utf8');
        }
    }

    throw new Error(`Could not find registry asset: ${fileName}`);
}

export function getLanguageManifest(lang: string) {
    try {
        const manifestContents = readRegistryAsset('manifest.json');
        const signatureContents = readRegistryAsset('manifest.sig');

        verifyManifestSignature(manifestContents, signatureContents);

        const registry = JSON.parse(manifestContents);
        return registry[lang] || null;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(`Could not load registry manifest: ${error.message}`);
        }

        throw new Error('Could not load registry manifest.');
    }
}
