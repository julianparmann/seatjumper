import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Fetch only active games with limited info for public users
    const games = await prisma.dailyGame.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        eventName: true,
        eventDate: true,
        venue: true,
        city: true,
        state: true,
        sport: true,
        spinPricePerBundle: true, // Only show final price, not costs
        currentEntries: true,
        maxEntries: true,
        // Count available inventory without revealing costs
        _count: {
          select: {
            ticketGroups: true,
            cardBreaks: true
          }
        }
      },
      orderBy: {
        eventDate: 'asc'
      }
    });

    // Transform to hide sensitive data
    const publicGames = games.map(game => ({
      id: game.id,
      eventName: game.eventName,
      eventDate: game.eventDate,
      venue: game.venue,
      city: game.city,
      state: game.state,
      sport: game.sport,
      spinPrice: game.spinPricePerBundle,
      spotsAvailable: game.maxEntries - game.currentEntries,
      hasInventory: game._count.ticketGroups > 0 && game._count.cardBreaks > 0
    }));

    return NextResponse.json(publicGames);
  } catch (error) {
    console.error('Error fetching public games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}