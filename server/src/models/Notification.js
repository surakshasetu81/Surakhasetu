import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  recipientRole: {
    type: String,
    enum: ['admin', 'staff', 'committee', 'ic_member', 'case_officer', 'auditor', 'complainant', 'all'],
    default: 'staff',
  },
  caseId: { type: String, index: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'CASE_SUBMITTED',
      'CASE_ASSIGNED',
      'CASE_REASSIGNED',
      'STATUS_UPDATED',
      'DEADLINE_APPROACHING',
      'CASE_OVERDUE',
      'CLARIFICATION_REQUESTED',
      'CLARIFICATION_SUBMITTED',
      'INQUIRY_SCHEDULED',
      'CASE_RESOLVED',
      'CASE_CLOSED',
      'SYSTEM_ALERT',
    ],
    default: 'STATUS_UPDATED',
  },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  confidentiality: {
    type: String,
    enum: ['INTERNAL_STAFF', 'COMPLAINANT_PUBLIC'],
    default: 'INTERNAL_STAFF',
  },
  actionLink: { type: String, default: null },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ caseId: 1, confidentiality: 1 });

export default mongoose.model('Notification', notificationSchema);

