import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    quizDay: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizDay', required: true },
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctIndex: { type: Number, required: true },
    referenceType: { type: String, enum: ['pdf', 'url', 'none'], default: 'none' },
    referencePdfUrl: { type: String }, // Cloudinary URL for PDF
    referencePdfPublicId: { type: String }, // Cloudinary public ID
    referenceUrl: { type: String }, // External URL
    referenceTitle: { type: String }, // Title for reference material
  },
  { timestamps: true }
);

export default mongoose.model('Question', questionSchema);