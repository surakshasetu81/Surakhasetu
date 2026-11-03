import express from 'express';
import CounsellingBooking from '../models/CounsellingBooking.js';
import Notification from '../models/Notification.js';
import { isDatabaseConnected } from '../config/database.js';
import { generateChatbotResponse, detectLanguage, EMERGENCY_HELPLINES } from '../services/safetyChatbotEngine.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

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
    const {
      caseId,
      preferredDate,
      preferredTimeSlot,
      preferredLanguage,
      preferredMode,
      preferredContactMethod,
      notes,
      contactPhoneOrEmail,
    } = req.body;

    if (!preferredDate || !preferredTimeSlot) {
      return res.status(400).json({ success: false, message: 'Preferred date and time slot are required' });
    }

    const booking = await CounsellingBooking.create({
      caseId: caseId ? String(caseId).trim() : undefined,
      preferredDate,
      preferredTimeSlot,
      preferredLanguage: preferredLanguage || 'en',
      preferredMode: preferredMode || 'telephonic',
      preferredContactMethod: preferredContactMethod || 'phone',
      notes: notes ? String(notes).trim() : '',
      contactPhoneOrEmail: contactPhoneOrEmail ? String(contactPhoneOrEmail).trim() : '',
      status: 'Pending',
    });

    // Notify authorized staff and counsellors
    try {
      await Notification.create({
        caseId: caseId || 'GENERAL',
        title: 'New Confidential Counselling Request',
        message: `Counselling session requested (${booking.referenceId || booking._id}) for preferred date ${preferredDate} (${preferredTimeSlot}).`,
        type: 'COUNSELLING_REQUESTED',
        confidentiality: 'INTERNAL_STAFF',
        actionLink: '/dashboard',
      });
    } catch (notifErr) {
      console.warn('Counselling notification dispatch notice:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Counselling slot request registered. An authorized support counsellor will connect with you during your selected window.',
      bookingId: booking._id,
      referenceId: booking.referenceId || booking._id,
      status: booking.status,
      details: {
        preferredDate: booking.preferredDate,
        preferredTimeSlot: booking.preferredTimeSlot,
        preferredMode: booking.preferredMode,
      },
    });
  } catch (err) {
    console.error('Failed to record counselling appointment request:', err);
    res.status(500).json({ success: false, message: 'Failed to record counselling appointment request' });
  }
});

// Authorized staff roles for accessing and managing counselling requests
const COUNSELLING_STAFF_ROLES = ['admin', 'staff', 'counsellor', 'committee', 'ic_member', 'case_officer'];

// GET /api/support/counselling-requests - View counselling requests (Authorized staff only)
router.get('/counselling-requests', protect, authorize(...COUNSELLING_STAFF_ROLES), async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database connection offline' });
  }

  try {
    const { status, caseId, limit = 50, page = 1 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (caseId) query.caseId = String(caseId).trim();

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [requests, total] = await Promise.all([
      CounsellingBooking.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('assignedCounsellor', 'name email role designation')
        .lean(),
      CounsellingBooking.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: requests.length,
      total,
      requests,
    });
  } catch (err) {
    console.error('Error fetching counselling requests:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve counselling requests' });
  }
});

// PATCH /api/support/counselling-requests/:id/status - Update counselling request status & notes
router.patch('/counselling-requests/:id/status', protect, authorize(...COUNSELLING_STAFF_ROLES), async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database connection offline' });
  }

  try {
    const { status, assignedCounsellor, note } = req.body;
    const validStatuses = ['Pending', 'Assigned', 'Contacted', 'Session Scheduled', 'Completed', 'Cancelled'];

    const updateFields = {};
    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }
      updateFields.status = status;
    }

    if (assignedCounsellor) {
      updateFields.assignedCounsellor = assignedCounsellor;
    }

    const booking = await CounsellingBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Counselling request not found' });
    }

    if (note && String(note).trim()) {
      booking.staffNotes.push({
        note: String(note).trim(),
        author: req.user._id,
        authorName: req.user.name || 'Authorized Counsellor',
      });
    }

    Object.assign(booking, updateFields);
    await booking.save();

    res.json({
      success: true,
      message: 'Counselling request status updated successfully',
      booking,
    });
  } catch (err) {
    console.error('Error updating counselling status:', err);
    res.status(500).json({ success: false, message: 'Failed to update counselling request status' });
  }
});

export default router;
