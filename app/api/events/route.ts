import { NextRequest, NextResponse } from 'next/server';
import { ticketEvolution } from '@/lib/api/ticket-evolution';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get query parameters
    const q = searchParams.get('q') || undefined;
    const category = searchParams.get('category') || undefined;
    const city = searchParams.get('city') || undefined;
    const state = searchParams.get('state') || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const per_page = searchParams.get('per_page') ? parseInt(searchParams.get('per_page')!) : 20;

    // Get events from next 30 days by default
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Search for events
    const response = await ticketEvolution.searchEvents({
      q,
      city,
      state,
      occurs_at_gte: today.toISOString(),
      occurs_at_lte: thirtyDaysFromNow.toISOString(),
      page,
      per_page,
      order_by: 'occurs_at',
    });

    // Transform events to our format
    const events = await Promise.all(
      (response.events || []).map(async (event: any) => {
        // Get price range for each event
        const priceRange = await ticketEvolution.getPriceRange(event.id);

        return {
          id: event.id.toString(),
          name: event.name,
          sport: ticketEvolution.mapCategoryToSport(
            event.category?.name || event.performers?.[0]?.category || 'OTHER'
          ),
          venue: event.venue?.name || 'TBD',
          city: event.venue?.city || '',
          state: event.venue?.state || '',
          datetime: new Date(event.occurs_at),
          minPrice: priceRange.min,
          maxPrice: priceRange.max,
          averagePrice: priceRange.average,
          inventoryCount: event.available_count || 0,
          popularity: event.popularity_score || 0,
        };
      })
    );

    return NextResponse.json({
      events,
      pagination: {
        page: response.current_page || page,
        per_page: response.per_page || per_page,
        total: response.total_entries || 0,
        total_pages: response.total_pages || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);

    // Return mock data if API fails (for development)
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        events: [
          {
            id: '1',
            name: 'Las Vegas Raiders vs Chicago Bears',
            sport: 'NFL',
            venue: 'Allegiant Stadium',
            city: 'Las Vegas',
            state: 'NV',
            datetime: new Date('2024-10-15T20:00:00'),
            minPrice: 125,
            maxPrice: 2500,
            averagePrice: 450,
            inventoryCount: 1500,
          },
          {
            id: '2',
            name: 'Los Angeles Lakers vs Golden State Warriors',
            sport: 'NBA',
            venue: 'Crypto.com Arena',
            city: 'Los Angeles',
            state: 'CA',
            datetime: new Date('2024-10-18T19:30:00'),
            minPrice: 85,
            maxPrice: 3000,
            averagePrice: 350,
            inventoryCount: 2000,
          },
        ],
        pagination: {
          page: 1,
          per_page: 20,
          total: 2,
          total_pages: 1,
        },
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}