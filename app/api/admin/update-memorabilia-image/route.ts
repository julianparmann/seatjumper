import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { breakId, imageUrl } = body;

    if (!breakId) {
      return NextResponse.json(
        { error: 'breakId is required' },
        { status: 400 }
      );
    }

    // Update the card break image
    const updatedBreak = await prisma.cardBreak.update({
      where: { id: breakId },
      data: { imageUrl: imageUrl || null }
    });

    return NextResponse.json(updatedBreak);
  } catch (error: any) {
    console.error('Error updating memorabilia image:', error);
    return NextResponse.json(
      { error: 'Failed to update image', details: error?.message },
      { status: 500 }
    );
  }
}