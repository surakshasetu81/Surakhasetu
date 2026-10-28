/**
 * Suraksha Setu — Client-Side Proof Vault Cryptography Engine
 * 
 * Cryptographic Specifications:
 * - Cipher: Authenticated AES-256-GCM
 * - Nonce: 12-byte cryptographically random IV (never reused)
 * - Key Derivation: PBKDF2-HMAC-SHA256 (100,000 iterations, 128-bit salt)
 * - Tamper Evidence: SHA-256 digest on ciphertext + AES-GCM 128-bit authentication tag
 * - Zero Knowledge: Server receives only encrypted bytes; keys exist solely in transient memory.
 */

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Derives a 256-bit AES-GCM encryption key from the vault secret key and salt using PBKDF2
 */
export async function deriveVaultKey(secretKey: string, saltBase64: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const cleanKey = secretKey.trim().toUpperCase();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(cleanKey),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const saltBytes = base64ToUint8Array(saltBase64);

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // Non-extractable for memory safety
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts an ArrayBuffer of plaintext evidence in the browser before upload
 */
export async function encryptEvidence(
  plaintextBuffer: ArrayBuffer,
  key: CryptoKey
): Promise<{
  ciphertext: ArrayBuffer;
  ivBase64: string;
  ciphertextHash: string;
}> {
  // Fresh 12-byte random IV for every file
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-256-GCM',
      iv,
    },
    key,
    plaintextBuffer
  );

  // Compute SHA-256 hash of the ciphertext for integrity checking
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', ciphertext);
  const ciphertextHash = bufferToHex(hashBuffer);

  return {
    ciphertext,
    ivBase64: uint8ArrayToBase64(iv),
    ciphertextHash,
  };
}

/**
 * Decrypts an encrypted ciphertext ArrayBuffer in the browser using the vault key and IV
 */
export async function decryptEvidence(
  ciphertextBuffer: ArrayBuffer,
  ivBase64: string,
  key: CryptoKey
): Promise<ArrayBuffer> {
  const iv = base64ToUint8Array(ivBase64);

  try {
    return await window.crypto.subtle.decrypt(
      {
        name: 'AES-256-GCM',
        iv: iv.buffer as ArrayBuffer,
      },
      key,
      ciphertextBuffer
    );
  } catch (err) {
    throw new Error('Authenticated decryption failed. Invalid secret key or ciphertext has been tampered with.');
  }
}

/**
 * Verifies SHA-256 hash of a downloaded ciphertext buffer
 */
export async function verifyCiphertextHash(
  ciphertextBuffer: ArrayBuffer,
  expectedHashHex: string
): Promise<boolean> {
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', ciphertextBuffer);
  const actualHash = bufferToHex(hashBuffer);
  return actualHash === expectedHashHex.trim().toUpperCase();
}

/**
 * Generates an official Proof Vault Recovery Kit text document
 */
export function generateRecoveryKitContent(
  vaultId: string,
  secretKey: string,
  createdAt: string
): string {
  return `========================================================================
SURAKSHA SETU — PROOF VAULT RECOVERY KIT & ENCRYPTION CREDENTIALS
========================================================================

VAULT ID:
${vaultId}

VAULT SECRET KEY:
${secretKey}

CREATION DATE:
${createdAt}

ENCRYPTION SUITE:
AES-256-GCM (Authenticated Encryption with Web Crypto API)
PBKDF2-HMAC-SHA256 (100,000 Iterations)

CRITICAL SECURITY NOTICE:
1. Your evidence is encrypted directly on your device before transmission.
2. The server NEVER has access to your plaintext evidence or your Secret Key.
3. If you lose your Vault Secret Key, your encrypted evidence CANNOT be recovered
   by anyone, including system administrators or support staff.
4. Keep this document stored in a secure location (e.g., password manager, 
   encrypted USB drive, or physical lockbox).
5. Never share this Secret Key with unauthorized third parties.

========================================================================
Suraksha Setu — सुरक्षित कार्यस्थल, सशक्त समाज
========================================================================
`;
}
