import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  fileUrl: { type: String, required: true },
  sizeBytes: { type: Number, default: 0 },
  mimeType: { type: String, default: 'application/octet-stream' },
  evidenceId: { type: String, default: null },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  },
  caseId: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  senderType: {
    type: String,
    enum: ['complainant', 'staff', 'admin', 'system'],
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  senderDisplayName: {
    type: String,
    required: true,
    default: 'Participant',
  },
  content: {
    type: String,
    required: true,
    maxlength: 4000,
    trim: true,
  },
  messageType: {
    type: String,
    enum: ['text', 'evidence_request', 'evidence_submission', 'case_update'],
    default: 'text',
  },
  attachments: {
    type: [attachmentSchema],
    default: [],
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: {
    type: Date,
    default: null,
  },
  readBy: {
    type: String,
    enum: ['complainant', 'staff', 'both', null],
    default: null,
  },
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ caseId: 1, senderType: 1, isRead: 1 });

export default mongoose.model('Message', messageSchema);

