import { NextResponse } from 'next/server';
import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function GET() {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.v2.utils.api_sign_request(
      { timestamp, folder: 'uploads' },
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json(
      {
        signature,
        timestamp,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 }
    );
  }
}