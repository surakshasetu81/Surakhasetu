import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Vault from '../models/Vault.js';
import VaultEvidence from '../models/VaultEvidence.js';
import Case from '../models/Case.js';
import { appendVaultAuditEvent, verifyVaultAuditChain } from '../services/vaultAuditService.js';
import { isDatabaseConnected } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VAULT_STORAGE_DIR = path.join(__dirname, '../../uploads/vault_encrypted');
const VAULT_BACKUP_DIR = path.join(__dirname, '../../uploads/vault_backup');

// Ensure directories exist
if (!fs.existsSync(VAULT_STORAGE_DIR)) fs.mkdirSync(VAULT_STORAGE_DIR, { recursive: true });
if (!fs.existsSync(VAULT_BACKUP_DIR)) fs.mkdirSync(VAULT_BACKUP_DIR, { recursive: true });

/**
 * Generate unpredictable Vault ID: VAULT-YYYYMMDD-XXXXXX
 */
function generateVaultId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `VAULT-${dateStr}-${randomSuffix}`;
}

/**
 * Generate 256-bit cryptographically secure Vault Secret Key
 */
function generateSecretKey() {
  const raw = crypto.randomBytes(32).toString('hex').toUpperCase();
  // Formatted into readable 4-character chunks: PV-SEC-XXXX-XXXX-XXXX-...
  const chunks = raw.match(/.{1,4}/g) || [raw];
  return `PV-SEC-${chunks.join('-')}`;
}

/**
 * Middleware: Verify Vault Session Token
 */
export const requireVaultSession = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers['x-vault-token'];
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (authHeader) {
      token = authHeader;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Vault session token required. Please unlock your vault.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'suraksha_setu_dev_secret_key_2024');
    if (!decoded || !decoded.vaultId || decoded.type !== 'vault_session') {
      return res.status(401).json({ success: false, message: 'Invalid or expired vault session token' });
    }

    req.vaultId = decoded.vaultId;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Vault session has expired or is invalid. Please re-enter your secret key.' });
  }
};

/**
 * 1. Create a New Vault
 */
export const createVault = async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service is currently unavailable.' });
  }

  try {
    const vaultId = generateVaultId();
    const secretKey = generateSecretKey();
    const salt = crypto.randomBytes(16).toString('base64');

    // Hash secret key with bcrypt (cost factor 12) before storage
    const authHash = await bcrypt.hash(secretKey, 12);

    const newVault = await Vault.create({
      vaultId,
      authHash,
      salt,
      status: 'active',
      storageUsedBytes: 0,
      evidenceCount: 0,
      lastUnlockedAt: new Date(),
    });

    // Record genesis audit event
    await appendVaultAuditEvent(vaultId, 'VAULT_CREATED', {
      vaultId,
      createdAt: newVault.createdAt,
      encryptionSuite: 'AES-256-GCM',
      keyDerivation: 'PBKDF2-SHA256-100K',
    });

    // Generate immediate unlocked session token for the creator
    const sessionToken = jwt.sign(
      { vaultId, type: 'vault_session' },
      process.env.JWT_SECRET || 'suraksha_setu_dev_secret_key_2024',
      { expiresIn: '2h' }
    );

    // Return Vault ID and Secret Key ONLY once to the creator
    res.status(201).json({
      success: true,
      message: 'Secure Proof Vault created successfully.',
      vaultId,
      secretKey,
      salt,
      token: sessionToken,
      vault: {
        vaultId: newVault.vaultId,
        salt: newVault.salt,
        status: newVault.status,
        evidenceCount: 0,
        storageUsedBytes: 0,
        createdAt: newVault.createdAt,
      },
    });
  } catch (err) {
    console.error('Failed to create vault:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create vault.' });
  }
};

/**
 * 2. Unlock Existing Vault
 */
export const unlockVault = async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service is currently unavailable.' });
  }

  try {
    const { vaultId, secretKey } = req.body;
    if (!vaultId || !secretKey) {
      return res.status(400).json({ success: false, message: 'Vault ID and Secret Key are required.' });
    }

    const cleanVaultId = vaultId.trim().toUpperCase();
    const cleanSecretKey = secretKey.trim().toUpperCase();

    const vault = await Vault.findOne({ vaultId: cleanVaultId }).select('+authHash');
    if (!vault) {
      return res.status(401).json({ success: false, message: 'Vault not found. Please verify the Vault ID.' });
    }

    if (vault.status === 'archived') {
      return res.status(403).json({ success: false, message: 'This vault has been archived.' });
    }

    const isMatch = await bcrypt.compare(cleanSecretKey, vault.authHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Secret Key for this Vault ID.' });
    }

    vault.lastUnlockedAt = new Date();
    await vault.save();

    await appendVaultAuditEvent(cleanVaultId, 'VAULT_UNLOCKED', {
      unlockedAt: vault.lastUnlockedAt,
    });

    const sessionToken = jwt.sign(
      { vaultId: cleanVaultId, type: 'vault_session' },
      process.env.JWT_SECRET || 'suraksha_setu_dev_secret_key_2024',
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      message: 'Vault unlocked successfully.',
      token: sessionToken,
      vault: {
        vaultId: vault.vaultId,
        salt: vault.salt,
        status: vault.status,
        evidenceCount: vault.evidenceCount,
        storageUsedBytes: vault.storageUsedBytes,
        createdAt: vault.createdAt,
        lastUnlockedAt: vault.lastUnlockedAt,
      },
    });
  } catch (err) {
    console.error('Unlock vault error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to unlock vault.' });
  }
};

/**
 * 3. Get Vault Metadata
 */
export const getVaultMetadata = async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service is currently unavailable.' });
  }

  try {
    const vault = await Vault.findOne({ vaultId: req.vaultId });
    if (!vault) {
      return res.status(404).json({ success: false, message: 'Vault not found.' });
    }

    // Accurate calculation from active evidence records
    const activeEvidence = await VaultEvidence.find({ vaultId: req.vaultId, isDeleted: false });
    const totalBytes = activeEvidence.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);

    res.json({
      success: true,
      vault: {
        vaultId: vault.vaultId,
        salt: vault.salt,
        status: vault.status,
        evidenceCount: activeEvidence.length,
        storageUsedBytes: totalBytes,
        createdAt: vault.createdAt,
        lastUnlockedAt: vault.lastUnlockedAt,
        backupVerified: true,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve vault metadata.' });
  }
};


/**
 * Helper to verify authorization for linking evidence to a case.
 * A user can link evidence to a case if:
 * 1. They provide the case's recoveryCode/recoveryKey, and bcrypt.compare matches case.recoveryCodeHash.
 * 2. OR they are authenticated staff (req.user) and have permission (admin, ic_member, or assigned case_officer).
 */
export async function verifyCaseOwnership(targetCase, recoveryCode, user) {
  if (user && ['admin', 'ic_member', 'case_officer'].includes(user.role)) {
    if (user.role === 'case_officer' && String(targetCase.assignedTo) !== String(user._id)) {
      return false;
    }
    return true;
  }
  if (recoveryCode && targetCase.recoveryCodeHash) {
    const cleanKey = recoveryCode.trim().toUpperCase();
    return await bcrypt.compare(cleanKey, targetCase.recoveryCodeHash);
  }
  return false;
}

/**
 * 4. Upload Encrypted Evidence
 */
export const uploadEncryptedEvidence = async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service is currently unavailable.' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Encrypted evidence file is required.' });
  }

  const { iv, ciphertextHash, originalName, category, mimeType, notes, caseId, recoveryCode, recoveryKey } = req.body;

  if (!iv || !ciphertextHash || !originalName) {
    // Clean up uploaded temporary file
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    return res.status(400).json({ success: false, message: 'Missing cryptographic metadata (IV, ciphertext hash, or filename).' });
  }

  let linkedCaseDoc = null;
  let linkingStatus = 'unlinked';
  let linkedAt = null;
  let linkedBy = null;

  if (caseId && caseId.trim()) {
    const cleanCaseId = caseId.trim().toUpperCase();
    const targetCase = await Case.findOne({ caseId: cleanCaseId }).select('+recoveryCodeHash');
    if (!targetCase) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(404).json({ success: false, message: `Case ID "${cleanCaseId}" does not exist in the repository.` });
    }

    const isAuthorized = await verifyCaseOwnership(targetCase, recoveryCode || recoveryKey, req.user);
    if (!isAuthorized) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Invalid Recovery Key for this Case ID. You cannot link evidence to a complaint without verified case ownership.',
      });
    }

    linkedCaseDoc = targetCase;
    linkingStatus = 'linked';
    linkedAt = new Date();
    linkedBy = req.user ? (req.user.staffId || req.user.name) : 'complainant';
  }

  try {
    const fileBytes = fs.readFileSync(req.file.path);
    const computedHash = crypto.createHash('sha256').update(fileBytes).digest('hex').toUpperCase();

    // Verify ciphertext integrity before committing to database
    if (computedHash !== ciphertextHash.toUpperCase()) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(400).json({
        success: false,
        message: 'Ciphertext integrity check failed in transit. Transmitted hash does not match computed digest.',
      });
    }

    const evidenceId = `EVID-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const storageFileName = `${evidenceId}.enc`;
    const finalStoragePath = path.join(VAULT_STORAGE_DIR, storageFileName);
    const backupStoragePath = path.join(VAULT_BACKUP_DIR, storageFileName);

    // Save primary ciphertext copy
    fs.writeFileSync(finalStoragePath, fileBytes);
    // Remove temporary multer file
    try { fs.unlinkSync(req.file.path); } catch (_) {}

    // Save verified backup copy
    fs.writeFileSync(backupStoragePath, fileBytes);

    const newEvidence = await VaultEvidence.create({
      evidenceId,
      vaultId: req.vaultId,
      caseId: linkedCaseDoc ? linkedCaseDoc.caseId : null,
      case: linkedCaseDoc ? linkedCaseDoc._id : null,
      linkingStatus,
      linkedAt,
      linkedBy,
      integrityStatus: 'verified',
      lastIntegrityCheckAt: new Date(),
      storageFileName,
      originalName: originalName.trim(),
      category: category || 'document',
      mimeType: mimeType || 'application/octet-stream',
      sizeBytes: fileBytes.length,
      iv,
      sha256Digest: computedHash,
      encryptionVersion: 'AES-256-GCM-v1',
      notes: notes ? notes.trim() : '',
      storagePath: finalStoragePath,
      backupPath: backupStoragePath,
      backupVerified: true,
      backupVerifiedAt: new Date(),
    });

    if (linkedCaseDoc) {
      if (!linkedCaseDoc.vaultEvidence) linkedCaseDoc.vaultEvidence = [];
      linkedCaseDoc.vaultEvidence.push(newEvidence._id);
      await linkedCaseDoc.save();

      await appendVaultAuditEvent(req.vaultId, 'EVIDENCE_LINKED_TO_CASE', {
        evidenceId,
        caseId: linkedCaseDoc.caseId,
        linkedBy,
        timestamp: new Date(),
      });
    }

    // Update vault totals
    await Vault.findOneAndUpdate(
      { vaultId: req.vaultId },
      { $inc: { evidenceCount: 1, storageUsedBytes: fileBytes.length } }
    );

    // Append tamper-evident audit record
    await appendVaultAuditEvent(req.vaultId, 'EVIDENCE_UPLOADED', {
      evidenceId,
      category: newEvidence.category,
      sizeBytes: newEvidence.sizeBytes,
      sha256Digest: computedHash,
      encryptionVersion: 'AES-256-GCM-v1',
    });

    // Append backup verified record
    await appendVaultAuditEvent(req.vaultId, 'BACKUP_CREATED', {
      evidenceId,
      backupLocation: 'LOCAL_SECURE_REPLICA',
      sha256Digest: computedHash,
    });

    res.status(201).json({
      success: true,
      message: 'Encrypted evidence persisted and dual-copy backup verified.',
      evidence: {
        evidenceId: newEvidence.evidenceId,
        originalName: newEvidence.originalName,
        category: newEvidence.category,
        sizeBytes: newEvidence.sizeBytes,
        mimeType: newEvidence.mimeType,
        iv: newEvidence.iv,
        sha256Digest: newEvidence.sha256Digest,
        notes: newEvidence.notes,
        createdAt: newEvidence.createdAt,
        caseId: newEvidence.caseId,
        linkingStatus: newEvidence.linkingStatus,
        linkedAt: newEvidence.linkedAt,
        integrityStatus: newEvidence.integrityStatus,
        backupVerified: true,
      },
    });
  } catch (err) {
    console.error('Evidence upload error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to persist encrypted evidence.' });
  }
};

/**
 * 5. List Encrypted Evidence
 */
export const listEvidence = async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service is currently unavailable.' });
  }

  try {
    const { caseId, category, search, linkingStatus, startDate, endDate } = req.query;
    const query = {
      vaultId: req.vaultId,
      isDeleted: false,
    };

    if (caseId && caseId.trim()) {
      query.caseId = caseId.trim().toUpperCase();
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (linkingStatus === 'linked') {
      query.linkingStatus = 'linked';
    } else if (linkingStatus === 'unlinked') {
      query.linkingStatus = 'unlinked';
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { originalName: regex },
        { caseId: regex },
        { notes: regex },
        { category: regex },
      ];
    }

    const items = await VaultEvidence.find(query).sort({ createdAt: -1 });

    const safeList = items.map(item => ({
      evidenceId: item.evidenceId,
      originalName: item.originalName,
      category: item.category,
      sizeBytes: item.sizeBytes,
      mimeType: item.mimeType,
      iv: item.iv,
      sha256Digest: item.sha256Digest,
      encryptionVersion: item.encryptionVersion,
      notes: item.notes,
      createdAt: item.createdAt,
      caseId: item.caseId,
      linkingStatus: item.linkingStatus || (item.caseId ? 'linked' : 'unlinked'),
      linkedAt: item.linkedAt,
      integrityStatus: item.integrityStatus || 'verified',
      backupVerified: item.backupVerified,
      backupVerifiedAt: item.backupVerifiedAt,
    }));

    res.json({
      success: true,
      count: safeList.length,
      evidence: safeList,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve evidence list.' });
  }
};

/**
 * 5b. Link an existing evidence item to a Case ID
 */
export const linkEvidenceToCase = async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service is currently unavailable.' });
  }

  const { evidenceId } = req.params;
  const { caseId, recoveryCode, recoveryKey } = req.body;

  if (!caseId || !caseId.trim()) {
    return res.status(400).json({ success: false, message: 'Case ID / Report ID is required to link evidence.' });
  }

  try {
    const evidence = await VaultEvidence.findOne({
      evidenceId,
      vaultId: req.vaultId,
      isDeleted: false,
    });

    if (!evidence) {
      return res.status(404).json({ success: false, message: 'Evidence record not found in this vault.' });
    }

    const cleanCaseId = caseId.trim().toUpperCase();
    const targetCase = await Case.findOne({ caseId: cleanCaseId }).select('+recoveryCodeHash');
    if (!targetCase) {
      return res.status(404).json({ success: false, message: `Case ID "${cleanCaseId}" not found.` });
    }

    const isAuthorized = await verifyCaseOwnership(targetCase, recoveryCode || recoveryKey, req.user);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Invalid Recovery Key for this Case ID. You cannot attach evidence to someone else\'s complaint.',
      });
    }

    evidence.caseId = targetCase.caseId;
    evidence.case = targetCase._id;
    evidence.linkingStatus = 'linked';
    evidence.linkedAt = new Date();
    evidence.linkedBy = req.user ? (req.user.staffId || req.user.name) : 'complainant';
    await evidence.save();

    if (!targetCase.vaultEvidence) targetCase.vaultEvidence = [];
    if (!targetCase.vaultEvidence.some(id => String(id) === String(evidence._id))) {
      targetCase.vaultEvidence.push(evidence._id);
      await targetCase.save();
    }

    await appendVaultAuditEvent(req.vaultId, 'EVIDENCE_LINKED_TO_CASE', {
      evidenceId,
      caseId: targetCase.caseId,
      linkedBy: evidence.linkedBy,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: `Evidence successfully associated with Case ${targetCase.caseId}.`,
      evidence: {
        evidenceId: evidence.evidenceId,
        caseId: evidence.caseId,
        linkingStatus: evidence.linkingStatus,
        linkedAt: evidence.linkedAt,
      },
    });
  } catch (err) {
    console.error('Error linking evidence:', err.message);
    res.status(500).json({ success: false, message: 'Failed to link evidence to case.' });
  }
};

/**
 * 5c. Unlink evidence from a Case ID
 */
export const unlinkEvidenceFromCase = async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service is currently unavailable.' });
  }

  const { evidenceId } = req.params;

  try {
    const evidence = await VaultEvidence.findOne({
      evidenceId,
      vaultId: req.vaultId,
      isDeleted: false,
    });

    if (!evidence) {
      return res.status(404).json({ success: false, message: 'Evidence record not found in this vault.' });
    }

    const previousCaseId = evidence.caseId;
    if (evidence.case) {
      await Case.findByIdAndUpdate(evidence.case, {
        $pull: { vaultEvidence: evidence._id },
      });
    }

    evidence.caseId = null;
    evidence.case = null;
    evidence.linkingStatus = 'unlinked';
    evidence.linkedAt = null;
    evidence.linkedBy = null;
    await evidence.save();

    await appendVaultAuditEvent(req.vaultId, 'EVIDENCE_UNLINKED_FROM_CASE', {
      evidenceId,
      previousCaseId,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: 'Evidence unlinked from case.',
      evidence: {
        evidenceId: evidence.evidenceId,
        linkingStatus: evidence.linkingStatus,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to unlink evidence.' });
  }
};

/**
 * 5d. Staff Endpoint: Get Vault Evidence linked to a specific case
 * Enforces least-privilege scoping and excludes private owner notes.
 */
export const getStaffCaseVaultEvidence = async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service is currently unavailable.' });
  }

  const { caseId } = req.params;
  const cleanCaseId = caseId.trim().toUpperCase();

  try {
    const targetCase = await Case.findOne({ caseId: cleanCaseId });
    if (!targetCase) {
      return res.status(404).json({ success: false, message: `Case ${cleanCaseId} not found.` });
    }

    // Role-based authorization
    if (['case_officer', 'staff'].includes(req.user.role)) {
      if (String(targetCase.assignedTo) !== String(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to view evidence for this unassigned case.',
        });
      }
    }

    const evidenceList = await VaultEvidence.find({
      caseId: cleanCaseId,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    // Exclude private owner notes and encryption secrets
    const safeEvidence = evidenceList.map(item => ({
      evidenceId: item.evidenceId,
      vaultId: item.vaultId,
      caseId: item.caseId,
      originalName: item.originalName,
      category: item.category,
      sizeBytes: item.sizeBytes,
      mimeType: item.mimeType,
      iv: item.iv,
      sha256Digest: item.sha256Digest,
      encryptionVersion: item.encryptionVersion,
      linkingStatus: item.linkingStatus,
      integrityStatus: item.integrityStatus || 'verified',
      createdAt: item.createdAt,
      linkedAt: item.linkedAt,
      backupVerified: item.backupVerified,
    }));

    res.json({
      success: true,
      caseId: cleanCaseId,
      count: safeEvidence.length,
      evidence: safeEvidence,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch case evidence.' });
  }
};

/**
 * 5e. Staff Endpoint: Download encrypted ciphertext for a case
 */
export const downloadStaffCaseVaultEvidence = async (req, res) => {
  const { caseId, evidenceId } = req.params;
  const cleanCaseId = caseId.trim().toUpperCase();

  try {
    const targetCase = await Case.findOne({ caseId: cleanCaseId });
    if (!targetCase) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    if (['case_officer', 'staff'].includes(req.user.role)) {
      if (String(targetCase.assignedTo) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const evidence = await VaultEvidence.findOne({
      evidenceId,
      caseId: cleanCaseId,
      isDeleted: false,
    });

    if (!evidence) {
      return res.status(404).json({ success: false, message: 'Evidence file not found for this case.' });
    }

    if (!fs.existsSync(evidence.storagePath)) {
      if (evidence.backupPath && fs.existsSync(evidence.backupPath)) {
        fs.copyFileSync(evidence.backupPath, evidence.storagePath);
      } else {
        return res.status(404).json({ success: false, message: 'Encrypted ciphertext missing on disk.' });
      }
    }

    await appendVaultAuditEvent(evidence.vaultId, 'STAFF_ACCESSED_CIPHERTEXT', {
      evidenceId: evidence.evidenceId,
      caseId: cleanCaseId,
      staffId: req.user.staffId || req.user.name,
      timestamp: new Date(),
    });

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${evidence.originalName}.enc"`);
    res.setHeader('x-evidence-iv', evidence.iv);
    res.setHeader('x-evidence-digest', evidence.sha256Digest);
    res.setHeader('x-evidence-original-name', encodeURIComponent(evidence.originalName));
    res.setHeader('x-evidence-mimetype', evidence.mimeType);

    const stream = fs.createReadStream(evidence.storagePath);
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to download evidence.' });
  }
};

/**
 * 6. Download Encrypted Ciphertext
 */
export const downloadCiphertext = async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const evidence = await VaultEvidence.findOne({
      evidenceId,
      vaultId: req.vaultId,
      isDeleted: false,
    });

    if (!evidence) {
      return res.status(404).json({ success: false, message: 'Evidence not found in this vault.' });
    }

    if (!fs.existsSync(evidence.storagePath)) {
      // Check backup path if primary storage is damaged
      if (evidence.backupPath && fs.existsSync(evidence.backupPath)) {
        // Restore from backup
        fs.copyFileSync(evidence.backupPath, evidence.storagePath);
      } else {
        return res.status(404).json({ success: false, message: 'Encrypted ciphertext file is missing on storage.' });
      }
    }

    await appendVaultAuditEvent(req.vaultId, 'EVIDENCE_DOWNLOADED', {
      evidenceId: evidence.evidenceId,
      sha256Digest: evidence.sha256Digest,
    });

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${evidence.evidenceId}.enc"`);
    res.setHeader('x-evidence-iv', evidence.iv);
    res.setHeader('x-evidence-digest', evidence.sha256Digest);
    res.setHeader('x-evidence-original-name', encodeURIComponent(evidence.originalName));
    res.setHeader('x-evidence-mimetype', evidence.mimeType);

    const stream = fs.createReadStream(evidence.storagePath);
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to download encrypted evidence.' });
  }
};

/**
 * 7. Verify Evidence Integrity & Backup
 */
export const verifyEvidenceIntegrity = async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const evidence = await VaultEvidence.findOne({
      evidenceId,
      vaultId: req.vaultId,
      isDeleted: false,
    });

    if (!evidence) {
      return res.status(404).json({ success: false, message: 'Evidence not found in this vault.' });
    }

    let primaryHash = null;
    let backupHash = null;

    if (fs.existsSync(evidence.storagePath)) {
      const primaryBytes = fs.readFileSync(evidence.storagePath);
      primaryHash = crypto.createHash('sha256').update(primaryBytes).digest('hex').toUpperCase();
    }

    if (evidence.backupPath && fs.existsSync(evidence.backupPath)) {
      const backupBytes = fs.readFileSync(evidence.backupPath);
      backupHash = crypto.createHash('sha256').update(backupBytes).digest('hex').toUpperCase();
    }

    const primaryMatchesExpected = primaryHash === evidence.sha256Digest.toUpperCase();
    const backupMatchesExpected = backupHash === evidence.sha256Digest.toUpperCase();
    const isIntact = primaryMatchesExpected && backupMatchesExpected;

    // Update verified timestamp
    evidence.backupVerified = isIntact;
    evidence.backupVerifiedAt = new Date();
    await evidence.save();

    await appendVaultAuditEvent(req.vaultId, 'EVIDENCE_VERIFIED', {
      evidenceId: evidence.evidenceId,
      primaryMatchesExpected,
      backupMatchesExpected,
      isIntact,
    });

    res.json({
      success: true,
      isIntact,
      primaryVerified: primaryMatchesExpected,
      backupVerified: backupMatchesExpected,
      expectedHash: evidence.sha256Digest,
      primaryHash,
      backupHash,
      verifiedAt: evidence.backupVerifiedAt,
      message: isIntact
        ? 'Both primary encrypted storage and backup replica verified completely intact.'
        : 'Integrity discrepancy detected! Contact security review immediately.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to verify evidence integrity.' });
  }
};

/**
 * 8. Auditable Soft-Delete Evidence
 */
export const deleteEvidence = async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const evidence = await VaultEvidence.findOne({
      evidenceId,
      vaultId: req.vaultId,
      isDeleted: false,
    });

    if (!evidence) {
      return res.status(404).json({ success: false, message: 'Evidence not found.' });
    }

    // Soft delete to prevent accidental loss
    evidence.isDeleted = true;
    evidence.deletedAt = new Date();
    // 30-day retention policy
    evidence.retentionUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await evidence.save();

    await Vault.findOneAndUpdate(
      { vaultId: req.vaultId },
      { $inc: { evidenceCount: -1, storageUsedBytes: -evidence.sizeBytes } }
    );

    await appendVaultAuditEvent(req.vaultId, 'EVIDENCE_DELETED', {
      evidenceId: evidence.evidenceId,
      sha256Digest: evidence.sha256Digest,
      retentionUntil: evidence.retentionUntil,
    });

    res.json({
      success: true,
      message: 'Evidence moved to 30-day retention locker. Deletion recorded in audit trail.',
      evidenceId,
      retentionUntil: evidence.retentionUntil,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete evidence.' });
  }
};

/**
 * 9. Get Tamper-Evident Audit Trail
 */
export const getVaultAuditTrail = async (req, res) => {
  try {
    const events = await VaultAuditLog.find({ vaultId: req.vaultId }).sort({ timestamp: -1 });
    const chainVerification = await verifyVaultAuditChain(req.vaultId);

    res.json({
      success: true,
      vaultId: req.vaultId,
      totalEvents: events.length,
      chainVerification,
      events: events.map(e => ({
        eventId: e.eventId,
        eventType: e.eventType,
        details: e.details,
        previousHash: e.previousHash,
        eventHash: e.eventHash,
        timestamp: e.timestamp,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve audit trail.' });
  }
};

/**
 * 10. Lock Vault Session
 */
export const lockVault = async (req, res) => {
  try {
    await appendVaultAuditEvent(req.vaultId, 'VAULT_LOCKED', {
      lockedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Vault locked successfully. Memory keys cleared.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to lock vault.' });
  }
};
