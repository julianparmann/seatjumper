import { NextResponse } from 'next/server';
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

    // Fetch all active stadiums
    const stadiums = await prisma.stadium.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        displayName: true,
        city: true,
        state: true,
        imagePath: true,
        imageWidth: true,
        imageHeight: true,
        sectionConfig: true
      },
      orderBy: { displayName: 'asc' }
    });

    return NextResponse.json(stadiums);
  } catch (error) {
    console.error('Failed to fetch stadiums:', error);
    return NextResponse.json({ error: 'Failed to fetch stadiums' }, { status: 500 });
  }
}