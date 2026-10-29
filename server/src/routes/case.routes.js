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
  assignCase,
  addInternalInvestigationNote,
  scheduleInquiryMeeting,
  recordInquiryFindings,
  closeOrReopenCase,
  complainantProvideClarification,
} from '../controllers/case.controller.js';
import {
  getStaffCaseVaultEvidence,
  downloadStaffCaseVaultEvidence,
} from '../controllers/vault.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/', submitCase);
router.post('/track', trackCase);
router.post('/track-lookup', trackCase);
router.post('/track/provide-info', complainantProvideClarification);

// Staff / IC Committee / Admin protected routes
const READ_ROLES = ['admin', 'staff', 'committee', 'ic_member', 'case_officer', 'auditor'];
const WORKFLOW_ROLES = ['admin', 'staff', 'committee', 'ic_member', 'case_officer'];
const AUTHORITY_ROLES = ['admin', 'committee', 'ic_member'];

router.get('/', protect, authorize(...READ_ROLES), getAllCases);
router.get('/:caseId', protect, authorize(...READ_ROLES), getCaseById);
router.get('/:caseId/assessment', protect, authorize(...READ_ROLES), getCaseAssessment);
router.get('/:caseId/vault-evidence', protect, authorize(...READ_ROLES), getStaffCaseVaultEvidence);
router.get('/:caseId/vault-evidence/:evidenceId/download', protect, authorize(...READ_ROLES), downloadStaffCaseVaultEvidence);

router.patch('/:caseId/status', protect, authorize(...WORKFLOW_ROLES), updateCaseStatus);
router.patch('/:caseId/priority', protect, authorize(...AUTHORITY_ROLES), overridePriority);
router.patch('/:caseId/verification-flag', protect, authorize(...WORKFLOW_ROLES), resolveVerificationFlag);
router.post('/:caseId/clarification', protect, authorize(...WORKFLOW_ROLES), requestCaseClarification);
router.patch('/:caseId/legal-review', protect, authorize(...WORKFLOW_ROLES), reviewLegalRecommendation);

// Enterprise workflow routes
router.patch('/:caseId/assign', protect, authorize(...AUTHORITY_ROLES), assignCase);
router.post('/:caseId/internal-notes', protect, authorize(...WORKFLOW_ROLES), addInternalInvestigationNote);
router.post('/:caseId/inquiry-meetings', protect, authorize(...WORKFLOW_ROLES), scheduleInquiryMeeting);
router.post('/:caseId/inquiry-findings', protect, authorize(...AUTHORITY_ROLES), recordInquiryFindings);
router.patch('/:caseId/close-or-reopen', protect, authorize(...AUTHORITY_ROLES), closeOrReopenCase);

export default router;
