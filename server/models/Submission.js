import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quizDay: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizDay', required: true },
    answers: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedIndex: { type: Number, required: true },
        isCorrect: { type: Boolean, required: true },
      },
    ],
    sectionScores: {
      Quran: { type: Number, default: 0 },
      Seerat: { type: Number, default: 0 },
    },
    totalScore: { type: Number, default: 0 },
    timeTakenSeconds: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Submission', submissionSchema);