import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Sport, Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get query parameters
    const q = searchParams.get('q') || undefined;
    const city = searchParams.get('city') || undefined;
    const state = searchParams.get('state') || undefined;
    const sportParam = searchParams.get('sport') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    // Validate and cast sport parameter to enum
    const sport = sportParam && Object.values(Sport).includes(sportParam as Sport)
      ? (sportParam as Sport)
      : undefined;

    // Build where clause
    const whereClause: Prisma.DailyGameWhereInput = {
      status: 'ACTIVE',
      ...(q && {
        OR: [
          { eventName: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { venue: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { city: { contains: q, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
      ...(city && { city: { contains: city, mode: Prisma.QueryMode.insensitive } }),
      ...(state && { state: { contains: state, mode: Prisma.QueryMode.insensitive } }),
      ...(sport && { sport }),
    };

    // Get total count for pagination
    const totalCount = await prisma.dailyGame.count({
      where: whereClause
    });

    // Get paginated active games from database
    const games = await prisma.dailyGame.findMany({
      skip,
      take: limit,
      where: whereClause,
      include: {
        ticketGroups: {
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
          take: 5 // Limit ticket groups to reduce memory
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
          take: 10 // Limit card breaks to reduce memory
        }
      },
      orderBy: {
        eventDate: 'asc',
      },
    });

    // Transform games to event format for compatibility
    const events = games.map((game: any) => {
      // Calculate min and max prices from ticket groups
      const ticketPrices = game.ticketGroups?.map((tg: any) => tg.pricePerSeat) || [];
      const minPrice = ticketPrices.length > 0 ? Math.min(...ticketPrices) : 0;
      const maxPrice = ticketPrices.length > 0 ? Math.max(...ticketPrices) : 0;

      // Count total available inventory
      const inventoryCount = game.ticketGroups?.reduce((sum: number, tg: any) => sum + tg.quantity, 0) || 0;

      return {
        id: game.id,
        name: game.eventName,
        sport: game.sport,
        venue: game.venue,
        city: game.city,
        state: game.state,
        datetime: game.eventDate,
        minPrice: minPrice,
        maxPrice: maxPrice,
        averagePrice: game.avgTicketPrice || 0,
        inventoryCount: inventoryCount,
        // Additional fields from our game model
        spinPrice: game.spinPricePerBundle,
        currentEntries: game.currentEntries,
        maxEntries: game.maxEntries,
        cardBreaksCount: game.cardBreaks?.length || 0,
      };
    });

    return NextResponse.json({
      events,
      pagination: {
        page,
        per_page: limit,
        total: totalCount,
        total_pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}