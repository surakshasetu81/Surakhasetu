import mongoose from 'mongoose';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET || 'suraksha-setu-safe-key-32-chars-!'; // 32 bytes fallback for local dev
const KEY_BUFFER = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();

function encryptField(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY_BUFFER, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

function decryptField(ciphertext) {
  if (!ciphertext || typeof ciphertext !== 'string' || !ciphertext.includes(':')) return ciphertext;
  try {
    const [ivHex, tagHex, dataHex] = ciphertext.split(':');
    if (!ivHex || !tagHex || !dataHex) return ciphertext;
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY_BUFFER, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(dataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return '[Encrypted Data]';
  }
}

const trustedContactSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  contactName: {
    type: String,
    required: true,
    trim: true,
  },
  encryptedPhoneNumber: {
    type: String,
    required: true,
    set: encryptField,
    get: decryptField,
  },
  relationship: {
    type: String,
    required: true,
    enum: ['parent', 'spouse', 'sibling', 'friend', 'colleague', 'lawyer', 'counsellor', 'other'],
    default: 'friend',
  },
  consentStatus: {
    type: Boolean,
    required: true,
    default: false,
  },
  alertHistory: [{
    alertId: { type: String, default: () => `ALT-${Date.now().toString(36).toUpperCase()}` },
    dispatchedAt: { type: Date, default: Date.now },
    deliveryStatus: { type: String, enum: ['PENDING', 'SENT', 'FAILED', 'MANUAL_DISPATCHED'], default: 'PENDING' },
    deliveryProvider: { type: String, default: 'manual_fallback' },
    includesLocation: { type: Boolean, default: false },
    recipientPhoneMasked: { type: String },
    errorMessage: { type: String, default: null },
  }],
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
});

export default mongoose.model('TrustedContact', trustedContactSchema);

