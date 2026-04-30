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
      // ✅ Cloudinary tracking for color variants
      cloudinary: {
        frontImage_id: String,
        backImage_id: String,
        migrated_at: Date,
      },
    },
  ],
  // ✅ Cloudinary tracking for main images
  cloudinary: {
    image_id: String,
    frontImage_id: String,
    backImage_id: String,
    migrated_at: Date,
  },
  // ✅ Backup of original URLs before migration
  backup_urls: {
    image: String,
    frontImage: String,
    backImage: String,
    colorVariants: [
      {
        colorName: String,
        frontImage: String,
        backImage: String,
      },
    ],
    backed_up_at: Date,
  },
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

// ✅ ADD INDEXES FOR FASTER QUERIES
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ category: 1, subcategory: 1 });

export default mongoose.model('Product', productSchema);
