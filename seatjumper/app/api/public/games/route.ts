import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cache } from '@/lib/cache/memory-cache';

// Lightweight public endpoint for fetching games list
export async function GET(req: NextRequest) {
  try {
    // Check cache first
    const cacheKey = 'public:games:active';
    const cachedGames = cache.get(cacheKey);

    if (cachedGames) {
      return NextResponse.json(cachedGames);
    }

    // Get only active games with minimal data
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
        status: true,
        // Pre-calculated fields only
        avgTicketPrice: true,
        avgBreakValue: true,
        spinPricePerBundle: true,
        spinPrice1x: true,
        spinPrice2x: true,
        spinPrice3x: true,
        spinPrice4x: true,
        currentEntries: true,
        maxEntries: true,
        // Count fields instead of loading full data
        _count: {
          select: {
            ticketGroups: true,
            ticketLevels: true,
            specialPrizes: true,
            cardBreaks: true
          }
        }
      },
      orderBy: {
        eventDate: 'asc'
      }
    });

    // Transform to include counts
    const gamesWithCounts = games.map(game => ({
      ...game,
      ticketGroupsCount: game._count.ticketGroups,
      ticketLevelsCount: game._count.ticketLevels,
      specialPrizesCount: game._count.specialPrizes,
      cardBreaksCount: game._count.cardBreaks,
      _count: undefined // Remove the _count field
    }));

    // Cache the result for 60 seconds
    cache.set(cacheKey, gamesWithCounts, 60);

    return NextResponse.json(gamesWithCounts);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}