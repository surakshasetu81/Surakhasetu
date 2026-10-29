import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  createVault,
  unlockVault,
  getVaultMetadata,
  uploadEncryptedEvidence,
  listEvidence,
  downloadCiphertext,
  verifyEvidenceIntegrity,
  deleteEvidence,
  getVaultAuditTrail,
  lockVault,
  requireVaultSession,
  linkEvidenceToCase,
  unlinkEvidenceFromCase,
} from '../controllers/vault.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMP_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `enc-${unique}.tmp`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB encrypted file limit
});

const router = express.Router();

// Public Vault Initialization & Authentication
router.post('/create', createVault);
router.post('/unlock', unlockVault);

// Authorized Vault Operations
router.get('/meta', requireVaultSession, getVaultMetadata);
router.post('/evidence/upload', requireVaultSession, upload.single('encryptedFile'), uploadEncryptedEvidence);
router.get('/evidence', requireVaultSession, listEvidence);
router.get('/evidence/:evidenceId/download', requireVaultSession, downloadCiphertext);
router.post('/evidence/:evidenceId/verify', requireVaultSession, verifyEvidenceIntegrity);
router.post('/evidence/:evidenceId/link', requireVaultSession, linkEvidenceToCase);
router.post('/evidence/:evidenceId/unlink', requireVaultSession, unlinkEvidenceFromCase);
router.delete('/evidence/:evidenceId', requireVaultSession, deleteEvidence);
router.get('/audit', requireVaultSession, getVaultAuditTrail);
router.post('/lock', requireVaultSession, lockVault);

export default router;
