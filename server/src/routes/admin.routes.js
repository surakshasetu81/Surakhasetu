import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { getAdminDashboardMetrics } from '../controllers/admin.dashboard.controller.js';
import {
  getAllStaff,
  createStaffAccount,
  updateStaffRole,
  toggleStaffStatus,
  resetStaffPassword,
} from '../controllers/admin.staff.controller.js';
import {
  evaluateSystemDeadlines,
  recordEscalationAction,
} from '../services/deadlineService.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// All routes here require authentication and Main Admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard Metrics
router.get('/dashboard-stats', getAdminDashboardMetrics);

// Staff Directory & Provisioning
router.get('/staff', getAllStaff);
router.post('/staff', createStaffAccount);
router.patch('/staff/:id/role', updateStaffRole);
router.patch('/staff/:id/status', toggleStaffStatus);
router.post('/staff/:id/reset-password', resetStaffPassword);

// Deadline & Escalation Engine Triggers
router.post('/deadlines/scan', async (req, res) => {
  try {
    const result = await evaluateSystemDeadlines();
    res.json({ success: true, message: 'System deadlines evaluated', result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to evaluate deadlines' });
  }
});

router.post('/deadlines/:caseId/action', async (req, res) => {
  try {
    const { actionType, reason, newTargetDate } = req.body;
    if (!actionType || !reason) {
      return res.status(400).json({ success: false, message: 'actionType and reason are required' });
    }

    const updatedCase = await recordEscalationAction({
      caseId: req.params.caseId,
      actionType,
      reason,
      authorizedUser: req.user,
      newTargetDate,
    });

    res.json({ success: true, message: 'Escalation action recorded', case: updatedCase });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to record escalation action' });
  }
});

// Append-only Audit Logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, action } = req.query;
    const query = {};
    if (action) query.action = action;

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('performedBy', 'name email role staffId');

    const total = await AuditLog.countDocuments(query);

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

export default router;
