import express from 'express';
import {
  getSafetyResources,
  submitSafetyStatus,
  saveTrustedContact,
  sendEmergencyAlert,
  startLocationSharing,
  stopLocationSharing,
  getNearbyAssistance,
  getStaffSafetyAlerts,
  updateStaffSafetyFollowup,
} from '../controllers/safety.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// ─── PUBLIC & COMPLAINANT SAFETY ENDPOINTS ──────────────────────────────────
router.get('/resources', getSafetyResources);
router.post('/status', submitSafetyStatus);
router.post('/trusted-contact', saveTrustedContact);
router.post('/send-alert', sendEmergencyAlert);
router.post('/location/share', startLocationSharing);
router.post('/location/stop', stopLocationSharing);
router.get('/nearby', getNearbyAssistance);

// ─── STAFF & ADMIN AUTHORIZED ESCALATION ENDPOINTS ──────────────────────────
const STAFF_ROLES = ['admin', 'staff', 'committee', 'ic_member', 'case_officer', 'auditor'];
const ACTION_ROLES = ['admin', 'staff', 'committee', 'ic_member', 'case_officer'];

router.get('/alerts', protect, authorize(...STAFF_ROLES), getStaffSafetyAlerts);
router.patch('/alerts/:id/followup', protect, authorize(...ACTION_ROLES), updateStaffSafetyFollowup);

export default router;

