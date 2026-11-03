import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  caseRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    index: true,
  },
  incidentCategory: {
    type: String,
    default: 'Unspecified',
  },
  priority: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM',
  },
  assignedStaffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  assignedStaffName: {
    type: String,
    default: 'Internal Committee Officer',
  },
  status: {
    type: String,
    enum: ['active', 'awaiting_complainant', 'awaiting_staff', 'evidence_requested', 'closed', 'archived'],
    default: 'active',
  },
  isAnonymous: {
    type: Boolean,
    default: true,
  },
  complainantPseudonym: {
    type: String,
    default: 'Complainant',
  },
  unreadStaffCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  unreadComplainantCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  lastMessagePreview: {
    type: String,
    default: '',
    maxlength: 160,
  },
  lastSenderType: {
    type: String,
    enum: ['complainant', 'staff', 'admin', 'system'],
    default: 'system',
  },
  evidenceRequested: {
    type: Boolean,
    default: false,
  },
  evidenceRequestDetails: {
    requestedAt: Date,
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    instructions: String,
    isFulfilled: { type: Boolean, default: false },
  },
}, { timestamps: true });

conversationSchema.index({ assignedStaffId: 1, status: 1 });
conversationSchema.index({ priority: 1, lastMessageAt: -1 });

export default mongoose.model('Conversation', conversationSchema);
