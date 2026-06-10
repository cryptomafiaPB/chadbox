import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const registryDirectories = [
    path.join(process.cwd(), 'src/registry'),
    path.join(process.cwd(), 'dist/registry'),
    path.dirname(fileURLToPath(import.meta.url)),
];

function readRegistryAsset(fileName: string): string {
    for (const registryDirectory of registryDirectories) {
        const assetPath = path.join(registryDirectory, fileName);

        if (fs.existsSync(assetPath)) {
            return fs.readFileSync(assetPath, 'utf8').trim();
        }
    }

    throw new Error(`Could not find registry asset: ${fileName}`);
}

function loadSigningKey(): string {
    const envKey = process.env.MANIFEST_SIGNING_KEY?.trim();

    if (envKey) {
        return envKey;
    }

    return readRegistryAsset('manifest.key');
}

export function verifyManifestSignature(manifestContents: string, signatureBase64: string): void {
    const signingKey = loadSigningKey();
    const expectedSignature = crypto
        .createHmac('sha256', signingKey)
        .update(manifestContents, 'utf8')
        .digest('base64');

    if (expectedSignature !== signatureBase64.trim()) {
        throw new Error('SECURITY ALERT: Registry manifest signature verification failed.');
    }
}
