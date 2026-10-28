import express from 'express';
import { generateLegalAssessment } from '../services/legalAssessmentEngine.js';

const router = express.Router();

// POST /api/legal-assessment
// Public endpoint for pre-submission legal categorization & applicable law recommendation
router.post('/', async (req, res) => {
  try {
    const {
      narrative,
      description,
      incidentCategory,
      contextType,
      targetMinor,
      isOnline,
      preferredLanguage,
      language,
    } = req.body;

    const rawNarrative = narrative || description || '';

    const assessment = await generateLegalAssessment({
      narrative: rawNarrative,
      incidentCategory,
      contextType,
      targetMinor,
      isOnline,
      language: language || preferredLanguage || 'en',
    });

    res.json(assessment);
  } catch (err) {
    console.error('Error in /api/legal-assessment:', err);
    res.status(500).json({
      assessmentType: 'LEGAL_CATEGORY_RECOMMENDATION',
      status: 'SERVICE_UNAVAILABLE',
      incidentCategory: {
        label: 'Legal Assessment Unavailable',
        explanation: 'Legal assessment is currently unavailable. You may proceed to submit your complaint without interruption.',
      },
      additionalCategories: [],
      potentiallyRelevantFrameworks: [],
      additionalInformationNeeded: [],
      modelMetadata: {
        modelVersion: 'N/A',
        knowledgeBaseVersion: '2026.2',
        assessmentMethod: 'service_error_fallback',
        isDemoModel: true,
        labelsPredicted: [],
      },
      disclaimer: 'These AI/ML-assisted suggestions are preliminary legal information based on the details provided. They do not determine whether an offence occurred, establish liability, or replace advice from a qualified legal professional or a decision by an authorized body.',
    });
  }
});

export default router;
