import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const games = await prisma.dailyGame.findMany({
      include: {
        _count: {
          select: {
            entries: true,
            ticketGroups: true,
            cardBreaks: true
          }
        }
      },
      orderBy: {
        eventDate: 'asc'
      }
    });

    return NextResponse.json({ games });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const game = await prisma.dailyGame.create({
      data: {
        eventName: body.eventName,
        eventDate: new Date(body.eventDate),
        venue: body.venue,
        city: body.city,
        state: body.state,
        sport: body.sport,
        maxEntries: body.maxEntries || 100,
        isActive: false, // Start as inactive
      }
    });

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_GAME',
        resource: 'DailyGame',
        resourceId: game.id,
        details: body
      }
    });

    return NextResponse.json({ game });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
}