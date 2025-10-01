import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, folder } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('Cloudinary not fully configured');
      // Return a placeholder URL for development
      return NextResponse.json({
        url: 'https://via.placeholder.com/800x600?text=Seat+View',
        publicId: 'placeholder',
        isPlaceholder: true
      });
    }

    // Upload to Cloudinary
    const result = await uploadImage(image, folder || 'seat-views');

    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
      isPlaceholder: false
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image', details: error?.message },
      { status: 500 }
    );
  }
}