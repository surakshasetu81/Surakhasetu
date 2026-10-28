import mongoose from 'mongoose';

const vaultSchema = new mongoose.Schema({
  vaultId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  authHash: {
    type: String,
    required: true,
    select: false, // Do not expose hash by default in queries
  },
  salt: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'locked', 'archived'],
    default: 'active',
  },
  storageUsedBytes: {
    type: Number,
    default: 0,
  },
  evidenceCount: {
    type: Number,
    default: 0,
  },
  lastUnlockedAt: {
    type: Date,
    default: null,
  },
  lastBackupVerifiedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Vault', vaultSchema);
