import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // Teacher profile fields
    subjects: { type: String, default: '' },
    classes: { type: String, default: '' },
    phone: { type: String, default: '' },
    age: { type: Number, default: null },
    qualification: { type: String, default: '' },
    teacherId: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
