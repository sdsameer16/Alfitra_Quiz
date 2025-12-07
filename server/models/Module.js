import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    section: { type: String, enum: ['Quran', 'Seerat'], required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Module', moduleSchema);

