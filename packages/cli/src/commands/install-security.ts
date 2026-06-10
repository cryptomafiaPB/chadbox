import crypto from 'crypto';
import fs from 'fs';

export async function computeFileSha256(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    const input = fs.createReadStream(filePath);

    for await (const chunk of input) {
        hash.update(chunk);
    }

    return hash.digest('hex');
}

export async function verifyDownloadedArchiveChecksum(
    archivePath: string,
    expectedSha256: string | undefined
): Promise<string> {
    if (!expectedSha256) {
        throw new Error(
            `SECURITY ALERT: Missing SHA256 checksum for downloaded archive: ${archivePath}\nExpected checksums: ${expectedSha256}`
        );
    }

    const normalizedExpected = expectedSha256.trim().toLowerCase();

    // if (!/^[a-f0-9]{64}$/.test(normalizedExpected)) {
    //     throw new Error(
    //         `SECURITY ALERT: Invalid SHA256 checksum format for downloaded archive: ${archivePath}\nExpected checksums: ${expectedSha256}\nCould not verify the pattern of provided checksum.`
    //     );
    // }

    const actualSha256 = await computeFileSha256(archivePath);

    if (actualSha256 !== normalizedExpected) {
        throw new Error(
            `SECURITY ALERT: Checksum mismatch for ${archivePath}\nExpected: ${normalizedExpected}\nReceived: ${actualSha256}\nAborting installation to prevent supply-chain attack.`
        );
    }

    return actualSha256;
}
