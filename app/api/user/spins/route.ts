import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's spin/jump history with full details
    const spins = await prisma.spinResult.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        game: {
          select: {
            eventName: true,
            eventDate: true,
            venue: true,
            city: true,
            state: true,
            sport: true,
            spinPricePerBundle: true
          }
        },
        bundles: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Return in the format expected by the orders page
    return NextResponse.json({
      spins,
      totalSpins: spins.length
    });
  } catch (error) {
    console.error('Error fetching user spins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spin history' },
      { status: 500 }
    );
  }
}