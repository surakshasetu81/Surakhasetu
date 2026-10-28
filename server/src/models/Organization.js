import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['employee', 'college_student'],
  },
  aliases: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
  domains: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
  idFormat: {
    type: String,
    required: true,
  },
  idRegex: {
    type: String,
    required: true,
  },
  // Store only cryptographic hashes of registered member IDs (zero plaintext storage)
  registeredIdHashes: [{
    type: String,
    select: false,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

organizationSchema.index({ name: 'text', aliases: 'text' });

export default mongoose.model('Organization', organizationSchema);

