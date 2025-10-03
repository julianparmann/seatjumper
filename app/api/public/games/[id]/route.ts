import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cache } from '@/lib/cache/memory-cache';

// Lightweight public endpoint for fetching a single game
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check cache first
    const cacheKey = `public:game:${id}`;
    const cachedGame = cache.get(cacheKey);

    if (cachedGame) {
      return NextResponse.json(cachedGame);
    }

    // Get the game with only necessary data for display
    const game = await prisma.dailyGame.findUnique({
      where: { id },
      select: {
        id: true,
        eventName: true,
        eventDate: true,
        venue: true,
        city: true,
        state: true,
        sport: true,
        status: true,
        stadiumId: true,
        // Pre-calculated fields
        avgTicketPrice: true,
        avgBreakValue: true,
        spinPricePerBundle: true,
        // Bundle-specific pricing
        spinPrice1x: true,
        spinPrice2x: true,
        spinPrice3x: true,
        spinPrice4x: true,
        currentEntries: true,
        maxEntries: true,
        // Include related data that's actually needed
        // Filter out VIP backup items (tierPriority > 1)
        ticketLevels: {
          where: {
            OR: [
              { tierLevel: { not: 'VIP_ITEM' } },
              {
                AND: [
                  { tierLevel: 'VIP_ITEM' },
                  { tierPriority: 1 }
                ]
              }
            ]
          },
          select: {
            id: true,
            level: true,
            levelName: true,
            quantity: true,
            pricePerSeat: true,
            viewImageUrl: true,
            sections: true,
            isSelectable: true,
            availableUnits: true,
            tierLevel: true,
            tierPriority: true,
            availablePacks: true
          }
        },
        ticketGroups: {
          where: {
            AND: [
              { status: 'AVAILABLE' },
              {
                OR: [
                  { tierLevel: { not: 'VIP_ITEM' } },
                  {
                    AND: [
                      { tierLevel: 'VIP_ITEM' },
                      { tierPriority: 1 }
                    ]
                  }
                ]
              }
            ]
          },
          select: {
            id: true,
            section: true,
            row: true,
            quantity: true,
            pricePerSeat: true,
            status: true,
            seatViewUrl: true,
            seatViewUrl2: true,
            availableUnits: true,
            tierLevel: true,
            tierPriority: true,
            notes: true,
            availablePacks: true
          }
        },
        specialPrizes: {
          select: {
            id: true,
            name: true,
            description: true,
            value: true,
            quantity: true,
            imageUrl: true,
            prizeType: true,
            availableUnits: true
          }
        },
        cardBreaks: {
          where: {
            AND: [
              { status: 'AVAILABLE' },
              {
                OR: [
                  { tierLevel: { not: 'VIP_ITEM' } },
                  {
                    AND: [
                      { tierLevel: 'VIP_ITEM' },
                      { tierPriority: 1 }
                    ]
                  }
                ]
              }
            ]
          },
          select: {
            id: true,
            breakName: true,
            breakValue: true,
            status: true,
            imageUrl: true,
            description: true,
            category: true,
            itemType: true,
            quantity: true,
            availableUnits: true,
            availablePacks: true,
            tierLevel: true,
            tierPriority: true
          }
        },
        stadium: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            defaultSeatViewUrl: true
          }
        }
        // DO NOT include entries, spinResults, or bestPrizes - those can be loaded separately if needed
      }
    });

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Get best prizes separately
    const bestPrizes = await prisma.bestPrizes.findUnique({
      where: { gameId: id }
    });

    // Combine game with best prizes
    const gameWithBestPrizes = {
      ...game,
      bestPrizes: bestPrizes ? {
        bestTicket: bestPrizes.bestTicket,
        bestMemorabillia: bestPrizes.bestMemorabillia
      } : null
    };

    // Cache the result for 60 seconds
    cache.set(cacheKey, gameWithBestPrizes, 60);

    return NextResponse.json(gameWithBestPrizes);
  } catch (error: any) {
    console.error('Error fetching game:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game', details: error?.message },
      { status: 500 }
    );
  }
}