import express from 'express';
import {
  submitCase,
  trackCase,
  getAllCases,
  getCaseById,
  updateCaseStatus,
  overridePriority,
  resolveVerificationFlag,
  getCaseAssessment,
  requestCaseClarification,
  reviewLegalRecommendation,
} from '../controllers/case.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/', submitCase);
router.post('/track', trackCase);
router.post('/track-lookup', trackCase);

// Staff / Admin protected routes
router.get('/', protect, authorize('admin', 'staff'), getAllCases);
router.get('/:caseId', protect, authorize('admin', 'staff'), getCaseById);
router.get('/:caseId/assessment', protect, authorize('admin', 'staff'), getCaseAssessment);
router.patch('/:caseId/status', protect, authorize('admin', 'staff'), updateCaseStatus);
router.patch('/:caseId/priority', protect, authorize('admin', 'staff'), overridePriority);
router.patch('/:caseId/verification-flag', protect, authorize('admin', 'staff'), resolveVerificationFlag);
router.post('/:caseId/clarification', protect, authorize('admin', 'staff'), requestCaseClarification);
router.patch('/:caseId/legal-review', protect, authorize('admin', 'staff'), reviewLegalRecommendation);

export default router;
