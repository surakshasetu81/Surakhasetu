import mongoose from 'mongoose';

const legalResourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  titleHindi: { type: String, trim: true },
  category: { type: String, enum: ['act', 'guideline', 'policy', 'procedure'], required: true },
  description: { type: String, required: true, maxlength: 2000 },
  descriptionHindi: { type: String, maxlength: 2000 },
  officialSource: { type: String, trim: true },
  year: Number,
  isActive: { type: Boolean, default: true },
  tags: [String],
}, { timestamps: true });

export default mongoose.model('LegalResource', legalResourceSchema);
