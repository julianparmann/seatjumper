import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get query parameters
    const q = searchParams.get('q') || undefined;
    const city = searchParams.get('city') || undefined;
    const state = searchParams.get('state') || undefined;
    const sport = searchParams.get('sport') || undefined;

    // Get active games from database
    const games = await prisma.dailyGame.findMany({
      where: {
        status: 'ACTIVE',
        ...(q && {
          OR: [
            { eventName: { contains: q, mode: 'insensitive' } },
            { venue: { contains: q, mode: 'insensitive' } },
            { city: { contains: q, mode: 'insensitive' } },
          ],
        }),
        ...(city && { city: { contains: city, mode: 'insensitive' } }),
        ...(state && { state: { contains: state, mode: 'insensitive' } }),
        ...(sport && { sport: { equals: sport } }),
      },
      include: {
        ticketGroups: true,
        cardBreaks: {
          where: {
            status: 'AVAILABLE'
          }
        }
      },
      orderBy: {
        eventDate: 'asc',
      },
    });

    // Transform games to event format for compatibility
    const events = games.map((game) => {
      // Calculate min and max prices from ticket groups
      const ticketPrices = game.ticketGroups.map(tg => tg.pricePerSeat);
      const minPrice = ticketPrices.length > 0 ? Math.min(...ticketPrices) : 0;
      const maxPrice = ticketPrices.length > 0 ? Math.max(...ticketPrices) : 0;

      // Count total available inventory
      const inventoryCount = game.ticketGroups.reduce((sum, tg) => sum + tg.quantity, 0);

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
        cardBreaksCount: game.cardBreaks.length,
      };
    });

    return NextResponse.json({
      events,
      pagination: {
        page: 1,
        per_page: events.length,
        total: events.length,
        total_pages: 1,
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