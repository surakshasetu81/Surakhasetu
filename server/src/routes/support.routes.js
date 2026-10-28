import express from 'express';
import CounsellingBooking from '../models/CounsellingBooking.js';
import { isDatabaseConnected } from '../config/database.js';
import { generateChatbotResponse, detectLanguage, EMERGENCY_HELPLINES } from '../services/safetyChatbotEngine.js';

const router = express.Router();

const VERIFIED_SUPPORT_PROVIDERS = [
  {
    id: 'tele-manas',
    name: 'Tele-MANAS (National Tele-Mental Health Programme)',
    organization: 'Ministry of Health & Family Welfare, Govt. of India',
    category: 'emotional',
    availability: '24 Hours / 7 Days a week • Free & Toll-Free',
    phone: '14416',
    phoneDisplay: '14416 or 1800-891-4416',
    website: 'https://telemanas.mohfw.gov.in/',
    languagesSupported: ['Hindi', 'English', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Odia', 'Assamese'],
    isVerified: true,
  },
  {
    id: 'kiran-helpline',
    name: 'KIRAN 24/7 Mental Health Helpline',
    organization: 'Ministry of Social Justice & Empowerment, Govt. of India',
    category: 'emotional',
    availability: '24/7 Toll-Free',
    phone: '18005990019',
    phoneDisplay: '1800-599-0019',
    website: 'https://disabilityaffairs.gov.in/',
    languagesSupported: ['Hindi', 'English', '13 Regional Languages'],
    isVerified: true,
  },
  {
    id: 'ncw-women-helpline',
    name: 'National Commission for Women Helpline',
    organization: 'National Commission for Women (NCW)',
    category: 'workplace_and_legal',
    availability: '24/7 Dedicated Support',
    phone: '7827170170',
    phoneDisplay: '7827170170 / 181',
    website: 'https://ncw.nic.in/',
    languagesSupported: ['Hindi', 'English'],
    isVerified: true,
  },
  {
    id: 'icall-psychosocial',
    name: 'iCALL Psychosocial Helpline',
    organization: 'Tata Institute of Social Sciences (TISS)',
    category: 'psychosocial_counselling',
    availability: 'Monday – Saturday: 10:00 AM – 8:00 PM',
    phone: '9152987821',
    phoneDisplay: '+91 9152987821',
    website: 'https://icallhelpline.org/',
    languagesSupported: ['English', 'Hindi', 'Marathi', 'Gujarati'],
    isVerified: true,
  },
  {
    id: 'nalsa-legal-aid',
    name: 'National Legal Services Authority (NALSA) Tele-Law Aid',
    organization: 'Statutory Body / Supreme Court of India',
    category: 'free_legal_aid',
    availability: 'Monday – Friday: 9:30 AM – 6:00 PM',
    phone: '15100',
    phoneDisplay: '15100 (Toll-Free National Legal Aid)',
    website: 'https://nalsa.gov.in/',
    languagesSupported: ['All Scheduled Indian Languages'],
    isVerified: true,
  },
];

// POST /api/support/chatbot - Intelligent Multilingual Women-Safety Assistant
router.post('/chatbot', (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const response = generateChatbotResponse(message.trim(), history || []);
    return res.json({
      success: true,
      ...response,
      detectedLanguage: detectLanguage(message.trim()),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[CHATBOT_ERROR]', err.message);
    return res.status(500).json({
      success: false,
      message: 'Safety Assistant encountered a temporary processing issue. For urgent assistance, please contact Women Helpline 181 or Emergency 112 directly.',
      emergencyHelplines: EMERGENCY_HELPLINES.slice(0, 3),
    });
  }
});

// GET /api/support/counsellors - List verified institutional and national support providers
router.get('/counsellors', (req, res) => {
  res.json({
    success: true,
    count: VERIFIED_SUPPORT_PROVIDERS.length,
    providers: VERIFIED_SUPPORT_PROVIDERS,
    disclaimer: 'Listed helplines and support organizations are verified public initiatives and certified mental health institutions. Services are free and confidential.',
  });
});

// POST /api/support/book-counselling - Request a counselling session slot
router.post('/book-counselling', async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({
      success: false,
      message: 'Direct booking service is currently undergoing institutional setup. Please connect directly with the 24/7 toll-free helplines (Tele-MANAS: 14416 or KIRAN: 1800-599-0019) for immediate support.',
    });
  }

  try {
    const { caseId, preferredDate, preferredTimeSlot, preferredLanguage, preferredMode, notes, contactPhoneOrEmail } = req.body;
    if (!preferredDate || !preferredTimeSlot) {
      return res.status(400).json({ success: false, message: 'Preferred date and time slot are required' });
    }

    const booking = await CounsellingBooking.create({
      caseId,
      preferredDate,
      preferredTimeSlot,
      preferredLanguage: preferredLanguage || 'en',
      preferredMode: preferredMode || 'telephonic',
      notes,
      contactPhoneOrEmail,
      status: 'REQUESTED',
    });

    res.status(201).json({
      success: true,
      message: 'Counselling slot request registered. An authorized support counsellor will connect with you during your selected window.',
      bookingId: booking._id,
      status: booking.status,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to record counselling appointment request' });
  }
});

export default router;
