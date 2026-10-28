import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  verifyOrganizationDetails,
  validateVerificationToken,
  CONFIGURED_ORGANIZATIONS,
} from '../services/organizationVerificationService.js';

const router = express.Router();

// Strict rate limiter to protect against ID enumeration and brute force verification attacks
const verificationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // max 15 verification attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    verified: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many verification attempts from this IP. Please wait 15 minutes before trying again to protect against unauthorized ID enumeration.',
  },
});

// POST /api/verification/verify-organization
router.post('/verify-organization', verificationRateLimiter, async (req, res) => {
  try {
    const { organizationType, organizationName, identifier, email } = req.body;

    const result = await verifyOrganizationDetails({
      organizationType,
      organizationName,
      identifier,
      email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (!result.verified) {
      // 400 Bad Request or 422 Unprocessable with informative message
      return res.status(result.code === 'ORGANIZATION_NOT_CONFIGURED' ? 404 : 400).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Error during organization verification:', err);
    return res.status(500).json({
      success: false,
      verified: false,
      code: 'VERIFICATION_SERVICE_ERROR',
      message: 'Organization verification service is temporarily unavailable. Please try again or continue with anonymous reporting.',
    });
  }
});

// GET /api/verification/known-organizations
// Returns publicly safe list of supported organizations for UI auto-suggestions
router.get('/known-organizations', (req, res) => {
  try {
    const safeList = CONFIGURED_ORGANIZATIONS.map(org => ({
      name: org.name,
      type: org.type,
      idFormat: org.idFormat,
    }));
    return res.json({ success: true, organizations: safeList });
  } catch (err) {
    return res.status(500).json({ success: false, organizations: [] });
  }
});

// POST /api/verification/validate-token
// Validates an existing verification token
router.post('/validate-token', (req, res) => {
  try {
    const { token } = req.body;
    const validated = validateVerificationToken(token);

    if (!validated) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'Verification token is invalid, tampered, or expired.',
      });
    }

    return res.json({
      success: true,
      valid: true,
      organizationType: validated.organizationType,
      organizationName: validated.organizationName,
    });
  } catch (err) {
    return res.status(500).json({ success: false, valid: false });
  }
});

export default router;

