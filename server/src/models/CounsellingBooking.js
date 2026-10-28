import mongoose from 'mongoose';

const counsellingBookingSchema = new mongoose.Schema({
  caseId: { type: String, trim: true },
  preferredDate: { type: String, required: true },
  preferredTimeSlot: { type: String, required: true },
  preferredLanguage: { type: String, default: 'en' },
  preferredMode: { type: String, enum: ['telephonic', 'video', 'in_person'], default: 'telephonic' },
  notes: { type: String, trim: true },
  contactPhoneOrEmail: { type: String, trim: true },
  status: { type: String, enum: ['REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], default: 'REQUESTED' },
}, { timestamps: true });

export default mongoose.model('CounsellingBooking', counsellingBookingSchema);
