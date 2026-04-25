import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    required: true,
  },
  subcategory: {
    type: String,
    default: '',
  },
  fabric: {
    type: String,
    default: '',
  },
  colors: {
    type: [String],
    default: [],
  },
  image: {
    type: String,
    default: null,
  },
  frontImage: {
    type: String,
    required: true,
  },
  backImage: {
    type: String,
    required: true,
  },
  // ✅ NEW: Per-color variant images
  colorVariants: [
    {
      colorName: {
        type: String,
        required: true,
      },
      colorCode: {
        type: String,
        required: true,
      },
      frontImage: {
        type: String,
        required: true,
      },
      backImage: {
        type: String,
        required: true,
      },
    },
  ],
  rating: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    default: '',
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Product', productSchema);
