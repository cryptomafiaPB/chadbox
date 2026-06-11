import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

function validateManifestEntry(lang: string, entry: Record<string, unknown>): void {
    if (!entry.name || typeof entry.name !== 'string') {
        throw new Error(`Invalid manifest: '${lang}' is missing a valid 'name'.`);
    }

    if (!entry.default_version || typeof entry.default_version !== 'string') {
        throw new Error(`Invalid manifest: '${lang}' is missing a valid 'default_version'.`);
    }

    if (!entry.versions || typeof entry.versions !== 'object') {
        throw new Error(`Invalid manifest: '${lang}' is missing a valid 'versions' map.`);
    }

    const versions = entry.versions as Record<string, Record<string, unknown>>;

    for (const [version, config] of Object.entries(versions)) {
        if (!config.run_cmd) {
            throw new Error(`Invalid manifest: '${lang}@${version}' is missing 'run_cmd'.`);
        }

        if (config.url && config.url !== 'system' && !config.sha256) {
            throw new Error(
                `Invalid manifest: '${lang}@${version}' has a remote URL without a 'sha256' checksum.`
            );
        }
    }
}

export function getLanguageManifest(lang: string) {
    try {
        const manifestContents = readRegistryAsset('manifest.json');
        const registry = JSON.parse(manifestContents);
        const entry = registry[lang];

        if (!entry) {
            return null;
        }

        validateManifestEntry(lang, entry);
        return entry;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(`Could not load registry manifest: ${error.message}`);
        }

        throw new Error('Could not load registry manifest.');
    }
}
