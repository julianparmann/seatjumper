import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT - Update stadium
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      displayName,
      city,
      state,
      imagePath,
      imageWidth,
      imageHeight,
      sectionConfig,
      defaultSeatViewUrl,
      isActive
    } = body;

    const stadium = await prisma.stadium.update({
      where: { id },
      data: {
        name,
        displayName,
        city,
        state,
        imagePath,
        imageWidth,
        imageHeight,
        sectionConfig,
        defaultSeatViewUrl: defaultSeatViewUrl || null,
        isActive
      }
    });

    return NextResponse.json(stadium);
  } catch (error) {
    console.error('Error updating stadium:', error);
    return NextResponse.json({ error: 'Failed to update stadium' }, { status: 500 });
  }
}

// DELETE - Delete stadium
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if stadium has any associated games
    const gamesCount = await prisma.dailyGame.count({
      where: { stadiumId: id }
    });

    if (gamesCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete stadium with associated games' },
        { status: 400 }
      );
    }

    await prisma.stadium.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting stadium:', error);
    return NextResponse.json({ error: 'Failed to delete stadium' }, { status: 500 });
  }
}