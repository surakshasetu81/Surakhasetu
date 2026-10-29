import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Case from '../models/Case.js';
import Evidence from '../models/Evidence.js';
import { calculateSha256, verifyEvidenceFile } from '../services/evidenceIntegrityService.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { isDatabaseConnected } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'audio/mpeg', 'audio/wav'];
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024;

import fs from 'fs';
import os from 'os';

const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'evidence')
  : path.join(__dirname, '../../uploads/evidence');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (dirErr) {
  console.warn('Evidence dir creation note:', dirErr.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error('File type not allowed'), false);
  },
});

const router = express.Router();

// POST /api/evidence/:caseId - Upload evidence with SHA-256 integrity calculation
router.post('/:caseId', upload.array('files', 5), async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service is currently unavailable. Evidence cannot be saved.' });
  }

  try {
    const foundCase = await Case.findOne({ caseId: req.params.caseId });
    if (!foundCase) return res.status(404).json({ success: false, message: 'Case not found' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const processedEvidence = [];
    const duplicateEvidenceFlags = [];

    for (const f of req.files) {
      let hash = null;
      try {
        hash = await calculateSha256(f.path);
      } catch (err) {
        console.error(`Hash calculation failed for ${f.filename}:`, err);
      }

      // Check if identical hash exists in prior submissions
      if (hash) {
        const existingEvidence = await Evidence.findOne({
          sha256Hash: hash,
          case: { $ne: foundCase._id },
        });

        if (existingEvidence) {
          duplicateEvidenceFlags.push({
            code: 'DUPLICATE_EVIDENCE_FILE',
            message: `Uploaded file '${f.originalname}' has an identical SHA-256 checksum to a file in another case.`,
            severity: 'WARNING',
            detectedAt: new Date(),
            resolved: false,
          });
        }
      }

      processedEvidence.push({
        case: foundCase._id,
        filename: f.filename,
        originalName: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        path: f.path,
        sha256Hash: hash,
        integrityStatus: 'VALID',
        lastVerifiedAt: new Date(),
      });
    }

    const evidenceRecords = await Evidence.insertMany(processedEvidence);

    foundCase.evidence.push(...evidenceRecords.map(e => e._id));

    // If duplicate evidence was detected, append verification flag without modifying priority
    if (duplicateEvidenceFlags.length > 0) {
      foundCase.verification.flags.push(...duplicateEvidenceFlags);
      if (foundCase.verification.status === 'CLEAR' || foundCase.verification.status === 'NOT_CHECKED') {
        foundCase.verification.status = 'NEEDS_REVIEW';
      }
    }

    await foundCase.save();

    res.status(201).json({
      success: true,
      message: 'Files uploaded successfully with cryptographic checksums computed',
      files: evidenceRecords.map(e => ({
        id: e._id,
        name: e.originalName,
        size: e.size,
        sha256Hash: e.sha256Hash,
        integrityStatus: e.integrityStatus,
      })),
    });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'File too large (max 10MB)' });
    res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
});

// GET /api/evidence/:evidenceId/verify - Staff: Verify cryptographic integrity of stored file
router.get('/:evidenceId/verify', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.evidenceId).select('+path');
    if (!evidence) {
      return res.status(404).json({ success: false, message: 'Evidence record not found' });
    }

    const result = await verifyEvidenceFile(evidence.path, evidence.sha256Hash);

    evidence.lastVerifiedAt = new Date();
    evidence.integrityStatus = result.verified ? 'VALID' : 'MISMATCH';
    await evidence.save();

    // If mismatch, also update the parent case
    if (!result.verified) {
      await Case.findByIdAndUpdate(evidence.case, {
        $set: { 'verification.status': 'EVIDENCE_INTEGRITY_CHECK_FAILED' },
        $push: {
          'verification.flags': {
            code: 'FILE_INTEGRITY_MISMATCH',
            message: `Cryptographic hash mismatch detected on evidence file '${evidence.originalName}'.`,
            severity: 'CRITICAL',
            detectedAt: new Date(),
            resolved: false,
          },
        },
      });
    }

    res.json({
      success: true,
      verified: result.verified,
      expectedHash: evidence.sha256Hash,
      actualHash: result.actualHash,
      integrityStatus: evidence.integrityStatus,
      error: result.error || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to verify evidence integrity' });
  }
});

export default router;
