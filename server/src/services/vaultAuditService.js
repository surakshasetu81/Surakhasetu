import crypto from 'crypto';
import VaultAuditLog from '../models/VaultAuditLog.js';

export const GENESIS_HASH = 'GENESIS_BLOCK_SURAKSHA_VAULT_00000000000000000000000000000000';

/**
 * Creates canonical string representation of an audit event for deterministic hashing
 */
export function canonicalizeAuditPayload(vaultId, eventType, timestamp, previousHash, details) {
  const sortedDetails = details && typeof details === 'object'
    ? Object.keys(details).sort().reduce((acc, k) => {
        acc[k] = details[k];
        return acc;
      }, {})
    : {};

  return [
    vaultId,
    eventType,
    new Date(timestamp).toISOString(),
    previousHash,
    JSON.stringify(sortedDetails),
  ].join('|');
}

/**
 * Computes SHA-256 hash of canonical audit payload
 */
export function computeEventHash(vaultId, eventType, timestamp, previousHash, details) {
  const canonical = canonicalizeAuditPayload(vaultId, eventType, timestamp, previousHash, details);
  return crypto.createHash('sha256').update(canonical).digest('hex').toUpperCase();
}

/**
 * Appends a tamper-evident audit event to the vault's hash chain
 */
export async function appendVaultAuditEvent(vaultId, eventType, details = {}) {
  const lastEvent = await VaultAuditLog.findOne({ vaultId }).sort({ timestamp: -1, _id: -1 });
  const previousHash = lastEvent ? lastEvent.eventHash : GENESIS_HASH;
  const timestamp = new Date();
  const eventId = `EVT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  
  const eventHash = computeEventHash(vaultId, eventType, timestamp, previousHash, details);

  const newLog = await VaultAuditLog.create({
    eventId,
    vaultId,
    eventType,
    details,
    previousHash,
    eventHash,
    timestamp,
  });

  return newLog;
}

/**
 * Verifies complete cryptographic integrity of the vault audit hash chain
 */
export async function verifyVaultAuditChain(vaultId) {
  const events = await VaultAuditLog.find({ vaultId }).sort({ timestamp: 1, _id: 1 });

  if (!events || events.length === 0) {
    return {
      isIntact: true,
      totalEvents: 0,
      chainLength: 0,
      brokenAtEventId: null,
      message: 'Audit chain is empty and valid.',
    };
  }

  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];

    // Check link integrity
    if (ev.previousHash !== expectedPrevHash) {
      return {
        isIntact: false,
        totalEvents: events.length,
        brokenAtEventId: ev.eventId,
        index: i,
        error: `Broken link: expected previousHash ${expectedPrevHash}, found ${ev.previousHash}`,
      };
    }

    // Check content integrity
    const recomputedHash = computeEventHash(ev.vaultId, ev.eventType, ev.timestamp, ev.previousHash, ev.details);
    if (recomputedHash !== ev.eventHash) {
      return {
        isIntact: false,
        totalEvents: events.length,
        brokenAtEventId: ev.eventId,
        index: i,
        error: `Digest mismatch: event content has been modified or tampered with`,
      };
    }

    expectedPrevHash = ev.eventHash;
  }

  return {
    isIntact: true,
    totalEvents: events.length,
    chainLength: events.length,
    brokenAtEventId: null,
    latestHash: expectedPrevHash,
    message: 'Cryptographic hash chain is verified intact and unbroken.',
  };
}
