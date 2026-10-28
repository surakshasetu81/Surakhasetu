import mongoose from 'mongoose';

const vaultAuditLogSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  vaultId: {
    type: String,
    required: true,
    index: true,
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'VAULT_CREATED',
      'VAULT_UNLOCKED',
      'EVIDENCE_UPLOADED',
      'EVIDENCE_VERIFIED',
      'EVIDENCE_DOWNLOADED',
      'EVIDENCE_DELETED',
      'BACKUP_CREATED',
      'BACKUP_VERIFIED',
      'VAULT_LOCKED',
    ],
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  previousHash: {
    type: String,
    required: true,
  },
  eventHash: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: false,
});

export default mongoose.model('VaultAuditLog', vaultAuditLogSchema);
