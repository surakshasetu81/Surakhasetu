import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { submitCase } from '../controllers/case.controller.js';
import Case from '../models/Case.js';
import Evidence from '../models/Evidence.js';
import { calculateSha256 } from '../services/evidenceIntegrityService.js';
import { isDatabaseConnected } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

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
  console.warn('Reports evidence dir creation note:', dirErr.message);
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

// POST /api/reports/submit - Submit report endpoint alias
router.post('/submit', submitCase);

// POST /api/reports/upload-evidence - Upload evidence linked to caseId
router.post('/upload-evidence', upload.array('files', 5), async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service unavailable' });
  }

  try {
    const caseId = req.body.caseId || req.query.caseId;
    if (!caseId) {
      return res.status(400).json({ success: false, message: 'caseId is required' });
    }

    const foundCase = await Case.findOne({ caseId });
    if (!foundCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const processedEvidence = [];
    for (const f of req.files) {
      let hash = null;
      try {
        hash = await calculateSha256(f.path);
      } catch (err) {
        console.error(`Hash calculation failed for ${f.filename}:`, err);
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
    await foundCase.save();

    res.status(201).json({
      success: true,
      message: 'Evidence files uploaded and associated with case',
      files: evidenceRecords.map(e => ({
        id: e._id,
        name: e.originalName,
        size: e.size,
        sha256Hash: e.sha256Hash,
      })),
    });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large (max 10MB)' });
    }
    res.status(500).json({ success: false, message: err.message || 'Evidence upload failed' });
  }
});

export default router;
