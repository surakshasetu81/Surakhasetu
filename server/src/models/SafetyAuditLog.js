import mongoose from 'mongoose';

const safetyAuditLogSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  actorType: {
    type: String,
    enum: ['complainant', 'staff', 'admin', 'system_safeguard'],
    required: true,
  },
  actorId: {
    type: String,
    default: 'anonymous',
  },
  actorName: {
    type: String,
    default: 'Complainant',
  },
  action: {
    type: String,
    required: true,
    enum: [
      'SAFETY_STATUS_RECORDED',
      'EMERGENCY_MODE_ACTIVATED',
      'EMERGENCY_CALL_INITIATED',
      'TRUSTED_CONTACT_SAVED',
      'TRUSTED_CONTACT_ALERT_REQUESTED',
      'LOCATION_SHARING_STARTED',
      'LOCATION_SHARING_STOPPED',
      'OSC_REFERRAL_REQUESTED',
      'EVIDENCE_PROTECTED_FROM_SAFETY',
      'STAFF_ALERT_ACKNOWLEDGED',
      'STAFF_FOLLOWUP_UPDATED',
      'DISCREET_SCREEN_ACTIVATED',
    ],
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddressMasked: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: false,
});

export default mongoose.model('SafetyAuditLog', safetyAuditLogSchema);

