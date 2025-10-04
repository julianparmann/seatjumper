import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cache } from '@/lib/cache/memory-cache';
import { calculatePackSpecificPricing } from '@/lib/pricing';

// Lightweight public endpoint for fetching games list
export async function GET(req: NextRequest) {
  try {
    // Check cache first
    const cacheKey = 'public:games:active';
    const cachedGames = cache.get(cacheKey);

    if (cachedGames) {
      return NextResponse.json(cachedGames);
    }

    // Get only active games with inventory data for pricing calculation
    const games = await prisma.dailyGame.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
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
            pricePerSeat: true,
            quantity: true,
            availableUnits: true,
            availablePacks: true,
            status: true,
            tierLevel: true,
            tierPriority: true
          }
        },
        ticketLevels: {
          where: {
            AND: [
              { quantity: { gt: 0 } },
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
            pricePerSeat: true,
            quantity: true,
            availableUnits: true,
            availablePacks: true,
            tierLevel: true,
            tierPriority: true
          }
        },
        specialPrizes: {
          where: { quantity: { gt: 0 } },
          select: {
            value: true,
            quantity: true,
            availableUnits: true
          }
        },
        cardBreaks: {
          where: {
            AND: [
              { status: 'AVAILABLE' },
              { quantity: { gt: 0 } },
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
            breakValue: true,
            quantity: true,
            availableUnits: true,
            availablePacks: true,
            status: true,
            tierLevel: true,
            tierPriority: true
          }
        },
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

    // Transform to include counts and dynamic pricing
    const gamesWithCounts = games.map(game => {
      // Calculate pack-specific pricing
      let dynamicPricing = null;
      try {
        dynamicPricing = calculatePackSpecificPricing(
          game.ticketLevels as any,
          game.ticketGroups as any,
          game.specialPrizes as any,
          game.cardBreaks as any,
          30 // 30% margin
        );
      } catch (error) {
        console.error(`Error calculating pricing for game ${game.id}:`, error);
      }

      return {
        id: game.id,
        eventName: game.eventName,
        eventDate: game.eventDate,
        venue: game.venue,
        city: game.city,
        state: game.state,
        sport: game.sport,
        status: game.status,
        currentEntries: game.currentEntries,
        maxEntries: game.maxEntries,
        // Include dynamic pricing if available, otherwise fall back to stored values
        spinPrice1x: dynamicPricing?.blue?.spinPrice1x || game.spinPrice1x,
        spinPrice2x: dynamicPricing?.blue?.spinPrice2x || game.spinPrice2x,
        spinPrice3x: dynamicPricing?.blue?.spinPrice3x || game.spinPrice3x,
        spinPrice4x: dynamicPricing?.blue?.spinPrice4x || game.spinPrice4x,
        // Pack-specific pricing for display
        bluePricePerBundle: dynamicPricing?.blue?.spinPrice1x || game.spinPricePerBundle,
        redPricePerBundle: dynamicPricing?.red?.spinPrice1x || (game.spinPricePerBundle ? game.spinPricePerBundle * 2 : null),
        goldPricePerBundle: dynamicPricing?.gold?.spinPrice1x || (game.spinPricePerBundle ? game.spinPricePerBundle * 3 : null),
        // Counts
        ticketGroupsCount: game._count.ticketGroups,
        ticketLevelsCount: game._count.ticketLevels,
        specialPrizesCount: game._count.specialPrizes,
        cardBreaksCount: game._count.cardBreaks
      };
    });

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