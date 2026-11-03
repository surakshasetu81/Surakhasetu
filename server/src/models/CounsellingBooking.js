import mongoose from 'mongoose';

const counsellingBookingSchema = new mongoose.Schema({
  referenceId: { type: String, unique: true, sparse: true, trim: true },
  caseId: { type: String, trim: true, index: true },
  preferredDate: { type: String, required: true },
  preferredTimeSlot: { type: String, required: true },
  preferredLanguage: { type: String, default: 'en' },
  preferredMode: { type: String, enum: ['telephonic', 'video', 'in_person'], default: 'telephonic' },
  preferredContactMethod: { type: String, enum: ['phone', 'email', 'platform_message', 'other'], default: 'phone' },
  contactPhoneOrEmail: { type: String, trim: true },
  notes: { type: String, trim: true },
  status: {
    type: String,
    enum: [
      'Pending',
      'Assigned',
      'Contacted',
      'Session Scheduled',
      'Completed',
      'Cancelled',
      // backward compatibility aliases
      'REQUESTED',
      'CONFIRMED',
    ],
    default: 'Pending',
  },
  assignedCounsellor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedCounsellorName: { type: String, default: null },
  staffNotes: [{
    note: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, default: 'Authorized Counsellor' },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

// Auto-generate human-friendly reference ID before save
counsellingBookingSchema.pre('save', function (next) {
  if (!this.referenceId) {
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.referenceId = `COUNS-${new Date().getFullYear()}-${randomHex}`;
  }
  next();
});

export default mongoose.model('CounsellingBooking', counsellingBookingSchema);

