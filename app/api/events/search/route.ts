import { NextRequest, NextResponse } from 'next/server';
import { ticketEvolution } from '@/lib/api/ticket-evolution';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const sport = searchParams.get('sport');
    const date = searchParams.get('date');

    // Search Ticket Evolution API
    const events = await ticketEvolution.searchEvents({
      q: query || undefined,
      occurs_at_gte: date || undefined,
      per_page: 50,
    });

    // Convert to our format and cache in database
    const eventDetails = await Promise.all(
      events.slice(0, 20).map(async (event) => {
        try {
          // Check if we have cached data
          const cached = await prisma.event.findUnique({
            where: { ticketEvolutionId: event.id.toString() },
          });

          if (cached && cached.lastUpdated > new Date(Date.now() - 3600000)) {
            return cached;
          }

          // Fetch fresh data
          const details = await ticketEvolution.convertToEventDetails(event);

          // Update cache
          const saved = await prisma.event.upsert({
            where: { ticketEvolutionId: event.id.toString() },
            create: {
              ticketEvolutionId: event.id.toString(),
              name: details.name,
              sport: details.sport,
              venue: details.venue,
              city: details.city,
              state: details.state,
              datetime: details.datetime,
              minPrice: details.minPrice,
              maxPrice: details.maxPrice,
              averagePrice: details.averagePrice,
              inventoryCount: details.inventoryCount,
            },
            update: {
              name: details.name,
              minPrice: details.minPrice,
              maxPrice: details.maxPrice,
              averagePrice: details.averagePrice,
              inventoryCount: details.inventoryCount,
              lastUpdated: new Date(),
            },
          });

          return saved;
        } catch (error) {
          console.error('Error processing event:', event.id, error);
          return null;
        }
      })
    );

    const validEvents = eventDetails.filter(Boolean);

    return NextResponse.json({ events: validEvents });
  } catch (error) {
    console.error('Error searching events:', error);
    return NextResponse.json(
      { error: 'Failed to search events' },
      { status: 500 }
    );
  }
}