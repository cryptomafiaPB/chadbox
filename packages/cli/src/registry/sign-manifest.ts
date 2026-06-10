import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const registryDir = path.join(path.dirname(fileURLToPath(import.meta.url)));
const manifestPath = path.join(registryDir, 'manifest.json');
const signaturePath = path.join(registryDir, 'manifest.sig');
const signingKeyPath = path.join(registryDir, 'manifest.key');

function loadSigningKey(): string {
    const envKey = process.env.MANIFEST_SIGNING_KEY?.trim();

    if (envKey) {
        return envKey;
    }

    if (fs.existsSync(signingKeyPath)) {
        return fs.readFileSync(signingKeyPath, 'utf8').trim();
    }

    throw new Error(
        'No manifest signing key found. Set MANIFEST_SIGNING_KEY or create src/registry/manifest.key with a shared secret string.'
    );
}

function computeManifestSignature(manifestContents: string, signingKey: string): string {
    return crypto
        .createHmac('sha256', signingKey)
        .update(manifestContents, 'utf8')
        .digest('base64');
}

async function main() {
    const manifestContents = fs.readFileSync(manifestPath, 'utf8');
    const signingKey = loadSigningKey();
    const signature = computeManifestSignature(manifestContents, signingKey);
    fs.writeFileSync(signaturePath, signature);
    console.log(`Wrote manifest signature to ${signaturePath}`);
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
