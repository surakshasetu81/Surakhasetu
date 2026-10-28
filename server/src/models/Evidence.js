import mongoose from 'mongoose';

const evidenceSchema = new mongoose.Schema({
  case: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true, select: false },
  sha256Hash: { type: String, required: false, index: true },
  integrityStatus: {
    type: String,
    enum: ['VALID', 'MISMATCH', 'UNVERIFIED'],
    default: 'VALID',
  },
  lastVerifiedAt: { type: Date, default: Date.now },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Evidence', evidenceSchema);
