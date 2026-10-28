import mongoose from 'mongoose';

const vaultEvidenceSchema = new mongoose.Schema({
  evidenceId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  vaultId: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  storageFileName: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['document', 'image', 'video', 'audio', 'note', 'consent_note', 'other'],
    default: 'document',
  },
  mimeType: {
    type: String,
    required: true,
    default: 'application/octet-stream',
  },
  sizeBytes: {
    type: Number,
    required: true,
  },
  iv: {
    type: String,
    required: true, // Base64 encoded 12-byte AES-GCM nonce
  },
  sha256Digest: {
    type: String,
    required: true, // SHA-256 hash of ciphertext for tamper detection
  },
  encryptionVersion: {
    type: String,
    required: true,
    default: 'AES-256-GCM-v1',
  },
  notes: {
    type: String,
    default: '',
  },
  storagePath: {
    type: String,
    required: true,
  },
  backupPath: {
    type: String,
    default: null,
  },
  backupVerified: {
    type: Boolean,
    default: true,
  },
  backupVerifiedAt: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  retentionUntil: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.model('VaultEvidence', vaultEvidenceSchema);
