import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  role: {
    type: String,
    enum: ['admin', 'staff', 'committee', 'ombudsman', 'user', 'ic_member', 'case_officer', 'auditor', 'counsellor'],
    default: 'staff',
  },
  icRole: {
    type: String,
    enum: ['presiding_officer', 'member', 'external_member', 'case_officer', 'inquiry_officer'],
    default: 'case_officer',
  },
  staffId: { type: String, sparse: true, trim: true },
  designation: { type: String, trim: true, default: 'Internal Committee Member' },
  organization: { type: String, trim: true, default: 'POSH Internal Complaints Committee' },
  department: { type: String, trim: true, default: 'Internal Complaints Committee' },
  officialPhone: { type: String, trim: true, default: null },
  isContactPublic: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false },
  revokedAt: { type: Date, default: null },
  revokedReason: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // Prevent double-hashing if password is already a valid bcrypt hash
  if (typeof this.password === 'string' && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$'))) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.methods.toComplainantView = function () {
  return {
    name: this.name,
    designation: this.designation || 'Internal Committee Member',
    icRole: this.icRole || 'Case Handling Officer',
    department: this.department || 'Internal Complaints Committee',
    organization: this.organization || 'Internal Complaints Committee',
    email: this.email,
    officialPhone: this.isContactPublic ? this.officialPhone : null,
    isContactPublic: !!this.isContactPublic,
  };
};

export default mongoose.model('User', userSchema);
