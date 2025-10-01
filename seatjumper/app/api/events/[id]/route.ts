import { NextRequest, NextResponse } from 'next/server';
import { ticketEvolution } from '@/lib/api/ticket-evolution';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const eventId = parseInt(id);

    // Get event details
    const eventResponse = await ticketEvolution.getEvent(eventId);
    const event = eventResponse.events?.[0] || eventResponse;

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get ticket groups for this event
    const ticketGroupsResponse = await ticketEvolution.getTicketGroups(eventId, {
      per_page: 100,
      order_by: 'price',
    });

    // Get price range
    const priceRange = await ticketEvolution.getPriceRange(eventId);

    // Transform to our format
    const transformedEvent = {
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
      ticketGroups: (ticketGroupsResponse.ticket_groups || []).map((group: any) => ({
        id: group.id,
        section: group.section,
        row: group.row || 'GA',
        quantity: group.quantity,
        price: group.price,
        splits: group.splits || [group.quantity],
        format: group.format,
        deliveryMethods: group.delivery_methods || [],
      })),
    };

    return NextResponse.json(transformedEvent);
  } catch (error) {
    console.error('Error fetching event:', error);

    // Return mock data if API fails (for development)
    if (process.env.NODE_ENV === 'development') {
      const { id } = await params;
      return NextResponse.json({
        id: id,
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
        ticketGroups: [
          {
            id: 1,
            section: '101',
            row: 'A',
            quantity: 4,
            price: 450,
            splits: [2, 4],
            format: 'eticket',
            deliveryMethods: ['email'],
          },
          {
            id: 2,
            section: '205',
            row: 'M',
            quantity: 2,
            price: 225,
            splits: [2],
            format: 'eticket',
            deliveryMethods: ['email'],
          },
        ],
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch event details' },
      { status: 500 }
    );
  }
}