import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

import {
  authenticateComplainant,
  authenticateConversationParticipant,
  getConversation,
  sendMessage,
  markAsRead,
  requestAdditionalEvidence,
  uploadAttachment,
  getStaffConversations,
  getStaffCommunicationStats,
  updateConversationStatus,
} from '../controllers/conversation.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ─── Multer Storage for Conversation Attachments ─────────────────────────────
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'audio/mpeg',
  'audio/wav',
];
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024;

const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'evidence')
  : path.join(__dirname, '../../uploads/evidence');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('Conversation uploadDir creation note:', e.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `conv-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error('File format not permitted for evidence attachments. Supported formats: PDF, JPG, PNG, WEBP, MP4, MP3, WAV.'), false);
  },
});

// ─── Rate Limiters ───────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many conversation authentication attempts. Please try again after 15 minutes.',
  },
});

const messageLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Message rate limit exceeded. Please wait a few moments before sending more messages.',
  },
});

// ─── Complainant Anonymous Authentication ────────────────────────────────────
router.post('/auth', authLimiter, authenticateComplainant);

// ─── Staff Dashboard Conversation Routes ─────────────────────────────────────
router.get('/staff/list', protect, getStaffConversations);
router.get('/staff/stats', protect, getStaffCommunicationStats);

// ─── Shared Case Conversation Endpoints ──────────────────────────────────────
router.get('/:caseId', authenticateConversationParticipant, getConversation);
router.post('/:caseId/messages', authenticateConversationParticipant, messageLimiter, sendMessage);
router.patch('/:caseId/read', authenticateConversationParticipant, markAsRead);

// Attachments & Evidence
router.post(
  '/:caseId/attachments',
  authenticateConversationParticipant,
  upload.single('file'),
  uploadAttachment
);

// Staff-Only Action Routes
router.post('/:caseId/request-evidence', authenticateConversationParticipant, requestAdditionalEvidence);
router.patch('/:caseId/status', authenticateConversationParticipant, updateConversationStatus);

export default router;

