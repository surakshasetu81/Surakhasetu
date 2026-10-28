import mongoose from 'mongoose';

const surveySubmissionSchema = new mongoose.Schema({
  topic: { type: String, required: true, trim: true },
  responses: { type: mongoose.Schema.Types.Mixed, required: true },
  submittedAt: { type: Date, default: Date.now },
  ipHash: { type: String, select: false },
}, { timestamps: true });

export default mongoose.model('SurveySubmission', surveySubmissionSchema);
