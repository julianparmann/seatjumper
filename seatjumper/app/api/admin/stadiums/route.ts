import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
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

    // Fetch all stadiums (including inactive for admin management)
    const stadiums = await prisma.stadium.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        city: true,
        state: true,
        imagePath: true,
        imageWidth: true,
        imageHeight: true,
        sectionConfig: true,
        defaultSeatViewUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { displayName: 'asc' }
    });

    return NextResponse.json(stadiums);
  } catch (error) {
    console.error('Failed to fetch stadiums:', error);
    return NextResponse.json({ error: 'Failed to fetch stadiums' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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

    // Check if stadium with same name exists
    const existing = await prisma.stadium.findUnique({
      where: { name }
    });

    if (existing) {
      return NextResponse.json({ error: 'Stadium with this name already exists' }, { status: 400 });
    }

    const stadium = await prisma.stadium.create({
      data: {
        name,
        displayName,
        city,
        state,
        imagePath: imagePath || '',
        imageWidth: imageWidth || 1920,
        imageHeight: imageHeight || 1080,
        sectionConfig: sectionConfig || {},
        defaultSeatViewUrl: defaultSeatViewUrl || null,
        isActive: isActive !== undefined ? isActive : true,
      }
    });

    return NextResponse.json(stadium);
  } catch (error) {
    console.error('Error creating stadium:', error);
    return NextResponse.json({ error: 'Failed to create stadium' }, { status: 500 });
  }
}