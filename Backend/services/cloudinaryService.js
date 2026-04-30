import cloudinary from '../config/cloudinary.js';
import fetch from 'node-fetch';

// Upload design preview image to Cloudinary
export async function uploadDesignPreview(imageUrl, orderId) {
  try {
    const response = await cloudinary.v2.uploader.upload(imageUrl, {
      public_id: `order-design-${orderId}`,
      folder: 'order-designs',
      resource_type: 'auto',
      overwrite: false,
    });

    return {
      url: response.secure_url,
      id: response.public_id,
    };
  } catch (error) {
    console.error('Error uploading design preview:', error);
    throw error;
  }
}

// Upload user profile picture to Cloudinary
export async function uploadProfilePicture(imageUrl, userId) {
  try {
    const response = await cloudinary.v2.uploader.upload(imageUrl, {
      public_id: `user-profile-${userId}`,
      folder: 'user-profiles',
      resource_type: 'auto',
      overwrite: true,
      transformation: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' }, // Profile pic size
      ],
    });

    return {
      url: response.secure_url,
      id: response.public_id,
    };
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
}

// Upload custom user logo/design to Cloudinary
export async function uploadCustomLogo(imageUrl, userId) {
  try {
    const response = await cloudinary.v2.uploader.upload(imageUrl, {
      public_id: `user-logo-${Date.now()}`,
      folder: `user-uploads/${userId}`,
      resource_type: 'auto',
      overwrite: false,
    });

    return {
      url: response.secure_url,
      id: response.public_id,
    };
  } catch (error) {
    console.error('Error uploading custom logo:', error);
    throw error;
  }
}

// Delete file from Cloudinary
export async function deleteFromCloudinary(publicId) {
  try {
    const response = await cloudinary.v2.uploader.destroy(publicId);
    return response;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
}

// Get all stickers from Cloudinary folder
export async function getStickersFromCloudinary() {
  try {
    const result = await cloudinary.v2.search
      .expression('folder:stickers')
      .execute();

    return result.resources.map(resource => ({
      name: resource.public_id.split('/').pop(),
      url: resource.secure_url,
      cloudinaryId: resource.public_id,
      category: 'sticker',
    }));
  } catch (error) {
    console.error('Error getting stickers from Cloudinary:', error);
    return [];
  }
}

export default {
  uploadDesignPreview,
  uploadProfilePicture,
  uploadCustomLogo,
  deleteFromCloudinary,
  getStickersFromCloudinary,
};
