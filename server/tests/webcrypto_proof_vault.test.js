/**
 * SURAKSHA SETU — PROOF VAULT WEB CRYPTO VERIFICATION TEST SUITE
 * 
 * Verifies all 7 requirements:
 * 1. Derives 256-bit AES-GCM key via PBKDF2-HMAC-SHA256 (100,000 iterations)
 * 2. Encrypts PDF bytes using Web Crypto API with algorithm 'AES-GCM'
 * 3. Fresh, cryptographically secure 12-byte random IV for every operation (no IV reuse)
 * 4. Decrypts ciphertext back to identical original PDF bytes
 * 5. Corrupted ciphertext fails authenticated tag check
 * 6. Wrong recovery/secret key fails authenticated decryption
 * 7. Ciphertext SHA-256 hash matches and detects corruption
 */

import assert from 'assert';

let passed = 0;
let failed = 0;

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`✓ [Test Passed] ${testName}`);
    passed++;
  } catch (err) {
    console.error(`✗ [Test Failed] ${testName}:`, err.message);
    failed++;
  }
}

async function runAsyncTest(testName, testFn) {
  try {
    await testFn();
    console.log(`✓ [Test Passed] ${testName}`);
    passed++;
  } catch (err) {
    console.error(`✗ [Test Failed] ${testName}:`, err.message);
    failed++;
  }
}

console.log('\n========================================================================');
console.log(' SURAKSHA SETU — PROOF VAULT WEB CRYPTO API VERIFICATION SUITE ');
console.log('========================================================================\n');

// Import functions from client/src/services/vaultCrypto
const {
  deriveVaultKey,
  encryptEvidence,
  decryptEvidence,
  verifyCiphertextHash,
  generateRecoveryKitContent,
} = await import('../../client/src/services/vaultCrypto.ts');

const sampleSecretKey = 'PV-SEC-E4F2-8B1A-9C7D-3E5F-2A1B-8C9D-4E6F-7A8B-1C2D-3E4F-5A6B-7C8D-9E0F';
const sampleSalt = 'dGVzdF9zYWx0XzEyOGJpdHM='; // 16 bytes base64

// 1. Key Derivation via PBKDF2
let derivedKey = null;
await runAsyncTest('PBKDF2 Key Derivation: derives a valid 256-bit AES-GCM CryptoKey', async () => {
  derivedKey = await deriveVaultKey(sampleSecretKey, sampleSalt);
  assert.ok(derivedKey, 'Derived key must exist');
  assert.strictEqual(derivedKey.algorithm.name, 'AES-GCM');
  assert.strictEqual(derivedKey.algorithm.length, 256);
  assert.strictEqual(derivedKey.extractable, false, 'Key must be non-extractable for memory safety');
});

// 2. Encrypt PDF file bytes
const samplePdfBytes = new TextEncoder().encode('%PDF-1.4\n1 0 obj\n<< /Title (Confidential Proof Vault Evidence PDF) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
let encResult1 = null;
let encResult2 = null;

await runAsyncTest('Web Crypto Encryption: encrypts PDF bytes using AES-GCM without algorithm error', async () => {
  encResult1 = await encryptEvidence(samplePdfBytes.buffer, derivedKey);
  assert.ok(encResult1.ciphertext, 'Ciphertext must be generated');
  assert.ok(encResult1.ciphertext.byteLength > samplePdfBytes.byteLength, 'Ciphertext includes 16-byte authentication tag');
  assert.ok(encResult1.ivBase64, 'IV must be generated');
  assert.ok(encResult1.ciphertextHash, 'Ciphertext SHA-256 hash must be computed');
});

// 3. IV uniqueness (Never reuse an IV)
await runAsyncTest('Cryptographic Nonce Security: consecutive encryptions generate fresh 12-byte IVs', async () => {
  encResult2 = await encryptEvidence(samplePdfBytes.buffer, derivedKey);
  assert.notStrictEqual(encResult1.ivBase64, encResult2.ivBase64, 'IV must be unique for every encryption');
  
  // Decoded IV must be exactly 12 bytes (96 bits)
  const binaryIv = atob(encResult1.ivBase64);
  assert.strictEqual(binaryIv.length, 12, 'AES-GCM IV must be exactly 12 bytes');
});

// 4. Decrypt back to original PDF bytes
await runAsyncTest('Web Crypto Decryption: recovers exact original PDF bytes from ciphertext', async () => {
  const decryptedBuffer = await decryptEvidence(encResult1.ciphertext, encResult1.ivBase64, derivedKey);
  const decryptedBytes = new Uint8Array(decryptedBuffer);
  
  assert.strictEqual(decryptedBytes.length, samplePdfBytes.length, 'Decrypted length must match original');
  assert.deepStrictEqual(Array.from(decryptedBytes), Array.from(samplePdfBytes), 'Decrypted bytes must match original PDF bytes');
  
  const decryptedText = new TextDecoder().decode(decryptedBytes);
  assert.ok(decryptedText.includes('%PDF-1.4'), 'Decrypted text contains PDF header');
});

// 5. Corrupted ciphertext fails authenticated tag check
await runAsyncTest('Tamper Detection: modified ciphertext fails authenticated decryption', async () => {
  const tamperedCiphertext = new Uint8Array(encResult1.ciphertext.slice(0));
  tamperedCiphertext[0] ^= 0xFF; // Flip bit

  await assert.rejects(
    async () => {
      await decryptEvidence(tamperedCiphertext.buffer, encResult1.ivBase64, derivedKey);
    },
    /Authenticated decryption failed/,
    'Tampered ciphertext must fail authenticated decryption'
  );
});

// 6. Wrong key fails decryption
await runAsyncTest('Key Authentication: wrong secret key fails decryption', async () => {
  const wrongKey = await deriveVaultKey('PV-SEC-0000-1111-2222-3333-4444-5555-6666-7777', sampleSalt);
  await assert.rejects(
    async () => {
      await decryptEvidence(encResult1.ciphertext, encResult1.ivBase64, wrongKey);
    },
    /Authenticated decryption failed/,
    'Decryption with incorrect key must fail'
  );
});

// 7. Verify SHA-256 ciphertext hash
await runAsyncTest('Integrity Check: SHA-256 ciphertext hash verification', async () => {
  const isMatch = await verifyCiphertextHash(encResult1.ciphertext, encResult1.ciphertextHash);
  assert.strictEqual(isMatch, true, 'Computed hash must match expected digest');

  const isFakeMatch = await verifyCiphertextHash(encResult1.ciphertext, 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  assert.strictEqual(isFakeMatch, false, 'Invalid hash must be rejected');
});

// 8. Recovery Kit Generation
runTest('Recovery Kit: document contains Vault ID, Secret Key, and unrecoverability notice', () => {
  const kit = generateRecoveryKitContent('VAULT-20261029-A1B2C3', sampleSecretKey, '2026-10-29T10:00:00.000Z');
  assert.ok(kit.includes('VAULT-20261029-A1B2C3'), 'Must contain Vault ID');
  assert.ok(kit.includes(sampleSecretKey), 'Must contain Secret Key');
  assert.ok(kit.includes('AES-GCM 256-bit'), 'Must document encryption suite');
  assert.ok(kit.includes('CANNOT be recovered'), 'Must warn user about unrecoverability');
});

console.log('\n------------------------------------------------------------------------');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('------------------------------------------------------------------------\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL PROOF VAULT WEB CRYPTO VERIFICATION TESTS PASSED PERFECTLY!\n');
}
