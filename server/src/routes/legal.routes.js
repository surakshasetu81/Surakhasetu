import express from 'express';
import { VERIFIED_LEGAL_KNOWLEDGE_BASE, LEGAL_KB_VERSION } from '../services/legalKnowledgeBase.js';

const router = express.Router();

// GET /api/legal/acts - List verified statutory frameworks
router.get('/acts', (req, res) => {
  const acts = Object.entries(VERIFIED_LEGAL_KNOWLEDGE_BASE).map(([id, item]) => ({
    id,
    actName: item.actName,
    shortName: item.shortName,
    statute: item.statute,
    categoryLabel: item.categoryLabel,
    categoryExplanation: item.categoryExplanation,
    provisionsCount: (item.provisions || []).length,
    officialSources: item.officialSources || [],
    clarificationPrompts: item.clarificationPrompts || [],
  }));

  res.json({
    success: true,
    version: LEGAL_KB_VERSION,
    count: acts.length,
    acts,
    disclaimer: 'This information is educational and preliminary. It does not replace advice from a qualified legal practitioner.',
  });
});

// GET /api/legal/acts/:id - Detailed statutory provisions for an act
router.get('/acts/:id', (req, res) => {
  const act = VERIFIED_LEGAL_KNOWLEDGE_BASE[req.params.id];
  if (!act) {
    return res.status(404).json({ success: false, message: 'Legal framework not found in approved knowledge base' });
  }

  res.json({
    success: true,
    version: LEGAL_KB_VERSION,
    act,
    disclaimer: 'This information is educational and preliminary. It does not replace advice from a qualified legal practitioner.',
  });
});

export default router;
