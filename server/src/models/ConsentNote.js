import mongoose from 'mongoose';
import crypto from 'crypto';

const consentNoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  caseId: { type: String, trim: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  recipient: { type: String, trim: true },
  timestamp: { type: Date, default: Date.now },
  sha256Digest: { type: String, uppercase: true },
  previousHash: { type: String, default: 'GENESIS' },
}, { timestamps: true });

consentNoteSchema.pre('save', function (next) {
  if (!this.sha256Digest) {
    const rawData = `${this.caseId || ''}:${this.title}:${this.content}:${this.timestamp.toISOString()}:${this.previousHash}`;
    this.sha256Digest = crypto.createHash('sha256').update(rawData).digest('hex').toUpperCase();
  }
  next();
});

export default mongoose.model('ConsentNote', consentNoteSchema);
