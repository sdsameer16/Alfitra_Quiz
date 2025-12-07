import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    quizDay: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizDay', required: true },
    text: { type: String, required: true },
    questionType: { type: String, enum: ['mcq', 'fillblank'], default: 'mcq' },
    options: [{ type: String }],
    correctIndex: { type: Number },
    // Fill in the blank fields
    correctAnswer1: { type: String }, // Surah number
    correctAnswer2: { type: String }, // Ayat number
    referenceType: { type: String, enum: ['pdf', 'url', 'none'], default: 'none' },
    referencePdfUrl: { type: String }, // Cloudinary URL for PDF
    referencePdfPublicId: { type: String }, // Cloudinary public ID
    referenceUrl: { type: String }, // External URL
    referenceTitle: { type: String }, // Title for reference material
  },
  { timestamps: true }
);

export default mongoose.model('Question', questionSchema);