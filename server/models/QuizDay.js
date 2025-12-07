import mongoose from 'mongoose';

const quizDaySchema = new mongoose.Schema(
  {
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    dateLabel: { type: String, required: true }, // e.g. '2025-12-04' or custom label
    isActive: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    responsesOpen: { type: Boolean, default: true }, // Admin can stop/allow responses
    resultsPublished: { type: Boolean, default: false }, // Admin publishes results for viewing
  },
  { timestamps: true }
);

export default mongoose.model('QuizDay', quizDaySchema);