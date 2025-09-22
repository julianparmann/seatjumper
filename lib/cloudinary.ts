import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Helper function to upload image from base64
export async function uploadImage(base64Image: string, folder: string = 'seatjumper') {
  try {
    // For stadiums, use higher resolution
    const transformation = folder === 'stadiums'
      ? [
          { width: 1920, height: 1080, crop: 'limit' },
          { quality: 'auto:best' }
        ]
      : [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto:good' }
        ];

    const result = await cloudinary.uploader.upload(base64Image, {
      folder: folder,
      resource_type: 'image',
      transformation: transformation,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

// Helper function to delete an image
export async function deleteImage(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}