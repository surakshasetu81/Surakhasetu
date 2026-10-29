import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  caseId: { type: String, index: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetModel: String,
  targetId: mongoose.Schema.Types.ObjectId,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
}, { timestamps: true });

// TTL: keep logs for 2 years
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

export default mongoose.model('AuditLog', auditLogSchema);
