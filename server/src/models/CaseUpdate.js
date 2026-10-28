import mongoose from 'mongoose';

const caseUpdateSchema = new mongoose.Schema({
  case: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  status: { type: String, required: true },
  message: { type: String, required: true, maxlength: 1000 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null },
  isVisibleToReporter: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('CaseUpdate', caseUpdateSchema);
