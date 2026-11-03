import mongoose from 'mongoose';

const locationShareSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  consentStatus: {
    type: Boolean,
    required: true,
    default: true,
  },
  durationMinutes: {
    type: Number,
    required: true,
    enum: [15, 60],
    default: 15,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  sharingStatus: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'REVOKED_BY_USER'],
    default: 'ACTIVE',
    index: true,
  },
  // Approximate coordinate stored only during active window; auto-cleared upon expiration/revocation
  latitude: {
    type: Number,
    default: null,
  },
  longitude: {
    type: Number,
    default: null,
  },
  accuracyMeters: {
    type: Number,
    default: null,
  },
  revokedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.model('LocationShare', locationShareSchema);

