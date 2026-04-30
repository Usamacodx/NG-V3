import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  profilePicture: {
    type: String,
    default: null,
  },
  profilePictureId: {
    type: String,
    default: null,
  },
  cart: [
    {
      _id: String,
      name: String,
      image: String,
      price: Number,
      quantity: Number,
      size: String,
      customization: String,
      customizationPrice: Number,
    },
  ],
  // Password reset token and expiry for forgot/reset flow
  resetToken: {
    type: String,
    default: null,
  },
  resetTokenExpires: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("User", UserSchema);
