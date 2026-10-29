import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  role: {
    type: String,
    enum: ['admin', 'staff', 'committee', 'ombudsman', 'user', 'ic_member', 'case_officer', 'auditor'],
    default: 'staff',
  },
  staffId: { type: String, sparse: true, trim: true },
  designation: { type: String, trim: true, default: 'Case Management Staff' },
  mustChangePassword: { type: Boolean, default: false },
  revokedAt: { type: Date, default: null },
  revokedReason: { type: String, default: null },
  department: { type: String, trim: true },
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

export default mongoose.model('User', userSchema);
