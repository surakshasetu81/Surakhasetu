import mongoose from 'mongoose';
import crypto from 'crypto';

const interactionLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  caseId: { type: String, trim: true },
  interactionDate: { type: Date, default: Date.now },
  counterparty: { type: String, required: true, trim: true },
  interactionType: {
    type: String,
    enum: ['verbal', 'email', 'chat', 'physical', 'phone', 'meeting', 'other'],
    default: 'other',
  },
  locationOrPlatform: { type: String, trim: true },
  summary: { type: String, required: true },
  witnesses: [{ type: String, trim: true }],
  sha256Digest: { type: String, uppercase: true },
  previousHash: { type: String, default: 'GENESIS' },
}, { timestamps: true });

interactionLogSchema.pre('save', function (next) {
  if (!this.sha256Digest) {
    const rawData = `${this.caseId || ''}:${this.counterparty}:${this.summary}:${this.interactionDate.toISOString()}:${this.previousHash}`;
    this.sha256Digest = crypto.createHash('sha256').update(rawData).digest('hex').toUpperCase();
  }
  next();
});

export default mongoose.model('InteractionLog', interactionLogSchema);
