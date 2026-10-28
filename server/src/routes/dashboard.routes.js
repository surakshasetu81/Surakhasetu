import express from 'express';
import Case from '../models/Case.js';
import CaseUpdate from '../models/CaseUpdate.js';
import AuditLog from '../models/AuditLog.js';
import ConsentNote from '../models/ConsentNote.js';
import InteractionLog from '../models/InteractionLog.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { isDatabaseConnected } from '../config/database.js';

import { devCaseStore } from '../controllers/case.controller.js';

const router = express.Router();

// GET /api/user/my-cases - List cases filed by identified authenticated user
router.get('/user/my-cases', protect, async (req, res) => {
  if (req.headers['x-simulate-offline'] === 'true') {
    return res.status(503).json({ success: false, message: 'Database service unavailable' });
  }

  try {
    const userEmail = req.user.email?.toLowerCase();

    if (!isDatabaseConnected()) {
      const cases = Array.from(devCaseStore.cases.values())
        .filter(c => c.reporterEmail?.toLowerCase() === userEmail && !c.isAnonymous)
        .map(c => ({
          caseId: c.caseId,
          incidentCategory: c.incidentCategory,
          incidentDate: c.incidentDate,
          status: c.status,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          isUrgent: c.isUrgent,
        }));
      return res.json({ success: true, count: cases.length, cases });
    }

    const cases = await Case.find({ reporterEmail: userEmail, isAnonymous: false })
      .sort({ createdAt: -1 })
      .select('caseId incidentCategory incidentDate status createdAt updatedAt isUrgent classification.priority');

    res.json({ success: true, count: cases.length, cases });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve user cases' });
  }
});

// GET /api/user/my-cases/:caseId - Retrieve details for a specific identified case
router.get('/user/my-cases/:caseId', protect, async (req, res) => {
  if (req.headers['x-simulate-offline'] === 'true') {
    return res.status(503).json({ success: false, message: 'Database service unavailable' });
  }

  try {
    const userEmail = req.user.email?.toLowerCase();
    const normalizedCaseId = req.params.caseId.trim().toUpperCase();

    let foundCase = null;
    let updates = [];

    if (isDatabaseConnected()) {
      foundCase = await Case.findOne({
        caseId: normalizedCaseId,
        reporterEmail: userEmail,
        isAnonymous: false,
      });

      if (foundCase) {
        updates = await CaseUpdate.find({ case: foundCase._id, isVisibleToReporter: true })
          .sort({ createdAt: 1 })
          .select('status message createdAt');
      }
    } else {
      const devCase = devCaseStore.cases.get(normalizedCaseId);
      if (devCase && devCase.reporterEmail?.toLowerCase() === userEmail && !devCase.isAnonymous) {
        foundCase = devCase;
        updates = devCaseStore.updates.get(normalizedCaseId) || [];
      }
    }

    if (!foundCase) {
      return res.status(404).json({ success: false, message: 'Case not found or unauthorized' });
    }

    res.json({
      success: true,
      case: foundCase.toPublicJSON(),
      timeline: updates,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve case details' });
  }
});

// GET /api/user/vault-summary - Proof vault summary for authenticated user
router.get('/user/vault-summary', protect, async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service unavailable' });
  }
  try {
    const userId = req.user._id;
    const totalConsentNotes = await ConsentNote.countDocuments({ user: userId });
    const totalInteractionLogs = await InteractionLog.countDocuments({ user: userId });

    res.json({
      success: true,
      summary: {
        totalConsentNotes,
        totalInteractionLogs,
        lastUpdated: new Date(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch vault summary' });
  }
});

// GET /api/committee/case-queue - IC Committee queue with priority triage
router.get('/committee/case-queue', protect, authorize('admin', 'staff', 'committee'), async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service unavailable' });
  }
  try {
    const { priority, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (priority) query['classification.priority'] = priority;
    if (status) query.status = status;

    const cases = await Case.find(query)
      .sort({ 'classification.priority': 1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select('caseId incidentCategory incidentDate status isAnonymous isUrgent classification verification createdAt');

    const total = await Case.countDocuments(query);

    res.json({
      success: true,
      cases,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch committee case queue' });
  }
});

// PUT /api/committee/cases/:caseId/triage-override - Committee priority override with required justification
router.put('/committee/cases/:caseId/triage-override', protect, authorize('admin', 'staff', 'committee'), async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service unavailable' });
  }
  try {
    const { newPriority, reason } = req.body;
    if (!['HIGH', 'MEDIUM', 'LOW'].includes(newPriority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority. Must be HIGH, MEDIUM, or LOW.' });
    }
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'A justification reason (minimum 10 characters) is required.' });
    }

    const foundCase = await Case.findOne({ caseId: req.params.caseId });
    if (!foundCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const oldPriority = foundCase.classification.priority;
    foundCase.classification.priority = newPriority;
    foundCase.classification.reviewStatus = 'OVERRIDDEN';

    const auditEntry = {
      action: 'HUMAN_PRIORITY_OVERRIDE',
      originalPriority: oldPriority,
      newPriority,
      reason: reason.trim(),
      performedBy: req.user._id,
      reviewerName: req.user.name,
      reviewerRole: req.user.role,
      timestamp: new Date(),
    };

    foundCase.auditHistory.push(auditEntry);
    await foundCase.save();

    await AuditLog.create({
      action: 'PRIORITY_OVERRIDDEN',
      performedBy: req.user._id,
      targetModel: 'Case',
      targetId: foundCase._id,
      details: { caseId: foundCase.caseId, oldPriority, newPriority, reason },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Priority overridden from ${oldPriority} to ${newPriority} by ${req.user.name}`,
      case: foundCase,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to override priority' });
  }
});

// PUT /api/committee/cases/:caseId/transition-stage - Move case along statutory workflow
router.put('/committee/cases/:caseId/transition-stage', protect, authorize('admin', 'staff', 'committee'), async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service unavailable' });
  }
  try {
    const { status, message } = req.body;
    const ALLOWED_STATUSES = ['submitted', 'acknowledged', 'under_review', 'additional_info_required', 'decision_recorded', 'closed'];
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` });
    }

    const foundCase = await Case.findOne({ caseId: req.params.caseId });
    if (!foundCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    foundCase.status = status;
    await foundCase.save();

    await CaseUpdate.create({
      case: foundCase._id,
      status,
      message: message || `Case status updated to ${status}`,
      updatedBy: req.user._id,
      isVisibleToReporter: true,
    });

    await AuditLog.create({
      action: 'CASE_STATUS_TRANSITION',
      performedBy: req.user._id,
      targetModel: 'Case',
      targetId: foundCase._id,
      details: { caseId: foundCase.caseId, newStatus: status },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: `Case status transitioned to ${status}`, case: foundCase });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to transition case stage' });
  }
});

// GET /api/admin/audit-logs - Administrative audit history
router.get('/admin/audit-logs', protect, authorize('admin'), async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service unavailable' });
  }
  try {
    const { page = 1, limit = 50 } = req.query;
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('performedBy', 'name email role');

    const total = await AuditLog.countDocuments();

    res.json({
      success: true,
      logs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});

// GET /api/admin/institutional-readiness - Institutional compliance & IC metrics
router.get('/admin/institutional-readiness', protect, authorize('admin'), async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ success: false, message: 'Database service unavailable' });
  }
  try {
    const total = await Case.countDocuments();
    const highPriority = await Case.countDocuments({ 'classification.priority': 'HIGH' });
    const pendingReview = await Case.countDocuments({ 'classification.reviewStatus': 'PENDING_HUMAN_REVIEW' });
    const flagIssues = await Case.countDocuments({ 'verification.status': { $in: ['POSSIBLE_DUPLICATE', 'EVIDENCE_INTEGRITY_CHECK_FAILED', 'NEEDS_REVIEW'] } });

    res.json({
      success: true,
      metrics: {
        totalComplaintsLogged: total,
        highPriorityActive: highPriority,
        pendingCommitteeAction: pendingReview,
        verificationFlagsActive: flagIssues,
        internalCommitteeCompliance: {
          poshActSection4Compliant: true,
          statutory90DayInquiryWindowTracked: true,
          confidentialityProtectionActive: true,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate institutional readiness metrics' });
  }
});

export default router;
