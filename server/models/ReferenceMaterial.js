import mongoose from 'mongoose';

const referenceMaterialSchema = new mongoose.Schema(
  {
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['pdf', 'image', 'note', 'message', 'link'], required: true },
    url: { type: String, required: true }, // Cloudinary URL or external link
    cloudinaryPublicId: { type: String }, // For Cloudinary file management
    originalFilename: { type: String }, // Original filename for downloads
    description: { type: String, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('ReferenceMaterial', referenceMaterialSchema);

