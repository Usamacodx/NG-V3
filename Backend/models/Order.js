import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
  name: String,
  price: Number,
  quantity: Number,
  size: String,
  customization: mongoose.Schema.Types.Mixed,
  customizationPrice: Number,
  frontImage: String,
  backImage: String,
});

const orderSchema = new mongoose.Schema({
  id: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true }, // ✅ Index for user queries
  items: [orderItemSchema],
  shippingMethod: String,
  shippingCost: Number,
  shipping: Number,
  tax: Number,
  total: Number,
  // ✅ NEW: Design preview image from Cloudinary
  designImage: {
    type: String,
    default: null,
  },
  designImageId: {
    type: String,
    default: null,
  },
  address: {
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    postal: String,
  },
  paymentMethod: String,
  paymentDetails: mongoose.Schema.Types.Mixed,
  status: { type: String, default: 'pending', index: true }, // ✅ Index for status filters
  createdAt: { type: Date, default: Date.now, index: -1 }, // ✅ Index for sorting by date
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
