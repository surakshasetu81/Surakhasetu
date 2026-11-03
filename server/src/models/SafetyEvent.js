import mongoose from 'mongoose';

const safetyEventSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
    index: true,
  },
  safetyStatus: {
    type: String,
    enum: ['SAFE', 'UNSURE', 'IMMEDIATE_HELP_NEEDED', 'MONITORED_SCREEN'],
    required: true,
    index: true,
  },
  userResponseText: {
    type: String,
    trim: true,
  },
  priority: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'HIGH',
    index: true,
  },
  triggerSource: {
    type: String,
    enum: ['post_submission_intake', 'direct_safety_check', 'evidence_vault', 'dashboard'],
    default: 'post_submission_intake',
  },
  emergencyActionsTaken: [{
    actionType: {
      type: String,
      enum: ['call_initiated_112', 'call_initiated_181', 'call_initiated_1098', 'call_initiated_ncw', 'trusted_contact_alerted', 'location_shared', 'osc_referral_viewed', 'evidence_protected'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  }],
  humanReviewRequired: {
    type: Boolean,
    default: true,
  },
  humanReviewStatus: {
    type: String,
    enum: ['PENDING', 'ACKNOWLEDGED', 'CONTACTED', 'RESOLVED', 'REFERRED_TO_SERVICES'],
    default: 'PENDING',
    index: true,
  },
  assignedStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  staffReviewNotes: {
    type: String,
    default: '',
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

safetyEventSchema.index({ createdAt: -1 });

export default mongoose.model('SafetyEvent', safetyEventSchema);

