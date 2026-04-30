import mongoose from 'mongoose';

const stickerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  keywords: {
    type: [String],
    default: [],
  },
  url: {
    type: String,
    required: true,
  },
  cloudinaryId: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'general',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Sticker', stickerSchema);
