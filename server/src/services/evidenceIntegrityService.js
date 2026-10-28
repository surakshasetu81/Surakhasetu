/**
 * Suraksha Setu — Evidence Integrity Service (Module D)
 *
 * Implements cryptographic integrity verification for uploaded evidentiary
 * files using standard SHA-256 hashing.
 *
 * NOTE:
 * A matching hash confirms that the uploaded file has not been altered or
 * corrupted in storage. It does not authenticate the real-world truthfulness
 * of the file's contents.
 */

import crypto from 'crypto';
import fs from 'fs';

/**
 * Calculates SHA-256 digest from file buffer or file path.
 *
 * @param {string|Buffer} source - File path string or Buffer
 * @returns {Promise<string>} Hexadecimal SHA-256 digest
 */
export async function calculateSha256(source) {
  return new Promise((resolve, reject) => {
    try {
      if (Buffer.isBuffer(source)) {
        const hash = crypto.createHash('sha256').update(source).digest('hex');
        return resolve(hash);
      }

      if (typeof source === 'string') {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(source);
        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', err => reject(err));
        return;
      }

      reject(new Error('Invalid source provided for SHA-256 calculation'));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Verifies a stored evidence record against its physical file on disk.
 *
 * @param {string} filePath - Absolute path to physical evidence file
 * @param {string} expectedHash - Recorded SHA-256 hash
 * @returns {Promise<{ verified: boolean, actualHash: string, error?: string }>}
 */
export async function verifyEvidenceFile(filePath, expectedHash) {
  try {
    if (!fs.existsSync(filePath)) {
      return { verified: false, actualHash: null, error: 'Physical evidence file not found on storage disk' };
    }

    const actualHash = await calculateSha256(filePath);
    const verified = actualHash.toLowerCase() === expectedHash.toLowerCase();

    return {
      verified,
      actualHash,
      error: verified ? null : 'Cryptographic checksum mismatch: File content does not match initial registration hash',
    };
  } catch (err) {
    return { verified: false, actualHash: null, error: err.message };
  }
}
