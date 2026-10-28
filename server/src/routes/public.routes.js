import express from 'express';
import Case from '../models/Case.js';
import { isDatabaseConnected } from '../config/database.js';

const router = express.Router();

const VERIFIED_EMERGENCY_CONTACTS = [
  {
    name: 'National Women Helpline',
    number: '181',
    description: '24/7 dedicated support for women facing distress, violence, or workplace harassment.',
    type: 'emergency',
  },
  {
    name: 'National Emergency Number',
    number: '112',
    description: 'Unified all-in-one emergency response for police, medical, and fire.',
    type: 'emergency',
  },
  {
    name: 'Childline India (POCSO / Minor Safety)',
    number: '1098',
    description: '24-hour national emergency outreach service for children in need of care and protection.',
    type: 'emergency',
  },
  {
    name: 'National Commission for Women (NCW)',
    number: '7827170170',
    description: 'Direct 24/7 WhatsApp and telephonic helpline for grievance registration.',
    type: 'institutional',
  },
  {
    name: 'Tele-MANAS Distress Helpline',
    number: '14416',
    description: 'Government 24/7 toll-free mental health and psychological first-aid helpline.',
    type: 'counselling',
  },
];

// GET /api/public/emergency-contacts
router.get('/emergency-contacts', (req, res) => {
  res.json({
    success: true,
    contacts: VERIFIED_EMERGENCY_CONTACTS,
  });
});

// GET /api/public/stats - Aggregate public statistics (safe to disclose, no PII)
router.get('/stats', async (req, res) => {
  if (!isDatabaseConnected()) {
    // Return honest fallback when database is offline
    return res.json({
      success: true,
      isLiveDatabase: false,
      stats: {
        totalCasesRecorded: 0,
        activeInquiries: 0,
        resolvedCases: 0,
        anonymousRatioPercent: 0,
        averageAcknowledgmentHours: 24,
      },
      message: 'Database currently disconnected. Showing initial baseline stats.',
    });
  }

  try {
    const totalCases = await Case.countDocuments();
    const resolvedCases = await Case.countDocuments({ status: { $in: ['decision_recorded', 'closed'] } });
    const activeInquiries = await Case.countDocuments({ status: { $in: ['acknowledged', 'under_review', 'additional_info_required'] } });
    const anonymousCases = await Case.countDocuments({ isAnonymous: true });

    const anonymousRatioPercent = totalCases > 0 ? Math.round((anonymousCases / totalCases) * 100) : 0;

    res.json({
      success: true,
      isLiveDatabase: true,
      stats: {
        totalCasesRecorded: totalCases,
        activeInquiries,
        resolvedCases,
        anonymousRatioPercent,
        averageAcknowledgmentHours: 24,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to aggregate public statistics' });
  }
});

export default router;
