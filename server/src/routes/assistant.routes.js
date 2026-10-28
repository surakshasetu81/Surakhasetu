import express from 'express';
import rateLimit from 'express-rate-limit';
import { processSafetyChat } from '../services/safetyAssistantService.js';

const router = express.Router();

// Specific rate limiter for assistant chat: 60 requests per 15 minutes per IP
const assistantLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many messages sent. Please wait a few moments before asking another question.',
  },
});

/**
 * POST /api/assistant/chat
 * Intelligent multilingual safety assistant endpoint
 */
router.post('/chat', assistantLimiter, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid text message is required.',
      });
    }

    const response = await processSafetyChat({ message, history });

    return res.status(200).json(response);
  } catch (err) {
    console.error('[AssistantRoute] Error processing chat:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to process your request at this moment. Please try again or call Women Helpline at 181.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

export default router;

