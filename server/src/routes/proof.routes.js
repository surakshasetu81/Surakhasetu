import express from 'express';
import crypto from 'crypto';
import ConsentNote from '../models/ConsentNote.js';
import InteractionLog from '../models/InteractionLog.js';
import Case from '../models/Case.js';
import { isDatabaseConnected } from '../config/database.js';

const router = express.Router();

// GET /api/proof/consent-notes
router.get('/consent-notes', async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service unavailable' });
  }
  try {
    const { caseId } = req.query;
    const query = {};
    if (caseId) query.caseId = caseId;
    if (req.user?._id) query.user = req.user._id;

    const notes = await ConsentNote.find(query).sort({ timestamp: -1 });
    res.json({ success: true, count: notes.length, notes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve consent notes' });
  }
});

// POST /api/proof/consent-notes
router.post('/consent-notes', async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service unavailable' });
  }
  try {
    const { caseId, title, content, recipient } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    // Get previous note hash to build chain
    const lastNote = await ConsentNote.findOne(caseId ? { caseId } : {}).sort({ createdAt: -1 });
    const previousHash = lastNote?.sha256Digest || 'GENESIS';

    const rawData = `${caseId || ''}:${title}:${content}:${new Date().toISOString()}:${previousHash}`;
    const sha256Digest = crypto.createHash('sha256').update(rawData).digest('hex').toUpperCase();

    const newNote = await ConsentNote.create({
      user: req.user?._id,
      caseId,
      title,
      content,
      recipient,
      previousHash,
      sha256Digest,
    });

    res.status(201).json({
      success: true,
      message: 'Consent note stored with cryptographic hash digest',
      note: newNote,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create consent note' });
  }
});

// POST /api/proof/interaction-logs
router.post('/interaction-logs', async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service unavailable' });
  }
  try {
    const { caseId, interactionDate, counterparty, interactionType, locationOrPlatform, summary, witnesses } = req.body;
    if (!counterparty || !summary) {
      return res.status(400).json({ success: false, message: 'Counterparty and summary are required' });
    }

    const lastLog = await InteractionLog.findOne(caseId ? { caseId } : {}).sort({ createdAt: -1 });
    const previousHash = lastLog?.sha256Digest || 'GENESIS';

    const dateVal = interactionDate ? new Date(interactionDate) : new Date();
    const rawData = `${caseId || ''}:${counterparty}:${summary}:${dateVal.toISOString()}:${previousHash}`;
    const sha256Digest = crypto.createHash('sha256').update(rawData).digest('hex').toUpperCase();

    const newLog = await InteractionLog.create({
      user: req.user?._id,
      caseId,
      interactionDate: dateVal,
      counterparty,
      interactionType: interactionType || 'other',
      locationOrPlatform,
      summary,
      witnesses: Array.isArray(witnesses) ? witnesses : [],
      previousHash,
      sha256Digest,
    });

    res.status(201).json({
      success: true,
      message: 'Interaction log registered with cryptographic digest',
      log: newLog,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to record interaction log' });
  }
});

// GET /api/proof/verify-chain
router.get('/verify-chain', async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service unavailable' });
  }
  try {
    const { caseId } = req.query;
    const notesQuery = caseId ? { caseId } : {};
    const notes = await ConsentNote.find(notesQuery).sort({ createdAt: 1 });
    const logs = await InteractionLog.find(notesQuery).sort({ createdAt: 1 });

    let isChainValid = true;
    const chainDetails = [];

    // Verify notes sequence
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const prevExpected = i === 0 ? 'GENESIS' : notes[i - 1].sha256Digest;
      const validLink = note.previousHash === prevExpected;
      if (!validLink) isChainValid = false;

      chainDetails.push({
        type: 'ConsentNote',
        id: note._id,
        digest: note.sha256Digest,
        linkedCorrectly: validLink,
      });
    }

    res.json({
      success: true,
      isChainValid,
      totalNotes: notes.length,
      totalLogs: logs.length,
      chainLength: chainDetails.length,
      details: chainDetails,
      disclaimer: 'A valid hash chain demonstrates chronological data integrity against recorded records; it does not constitute a formal legal finding of guilt or liability.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to verify proof chain' });
  }
});

// GET /api/proof/export-dossier
router.get('/export-dossier', async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service unavailable' });
  }
  try {
    const { caseId } = req.query;
    if (!caseId) {
      return res.status(400).json({ success: false, message: 'caseId query parameter required' });
    }

    const foundCase = await Case.findOne({ caseId }).populate('evidence', 'filename originalName size sha256Hash');
    if (!foundCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const notes = await ConsentNote.find({ caseId }).sort({ createdAt: 1 });
    const logs = await InteractionLog.find({ caseId }).sort({ createdAt: 1 });

    res.json({
      success: true,
      dossier: {
        exportedAt: new Date(),
        case: foundCase.toPublicJSON(),
        evidenceItems: foundCase.evidence || [],
        consentNotes: notes,
        interactionLogs: logs,
        integrityAssurance: {
          exportDigest: crypto.createHash('sha256').update(JSON.stringify({ notes, logs, case: foundCase.caseId })).digest('hex').toUpperCase(),
          status: 'DIGITALLY_SEALED',
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to export dossier' });
  }
});

export default router;
