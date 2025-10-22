import { NextRequest, NextResponse } from 'next/server';
import { mercuryAPI } from '@/lib/api/mercury';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface SeatOption {
  id: string; // exchangeTicketGroupId
  section: string;
  row: string;
  seats: string; // e.g., "1-2" or "5-8"
  quantity: number;
  price: number; // wholesale price (admin only)
  priceCategory: 'low' | 'medium' | 'high' | 'premium'; // for non-admin users
  available: boolean;
}

export interface SeatOptionsResponse {
  eventId: string;
  eventName: string;
  eventDate: string;
  venue: string;
  quantity: number;
  seatOptions: SeatOption[];
  priceRange: {
    min: number;
    max: number;
  };
}

/**
 * Get detailed seat options for an event filtered by quantity
 * Shows individual ticket groups with seat details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: eventId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const quantity = parseInt(searchParams.get('quantity') || '2');
    const isAdmin = session?.user?.email === 'julianparmann@gmail.com' ||
                   session?.user?.email === 'admin@seatjumper.com';

    console.log(`[Seat Options] Event ${eventId}, Quantity ${quantity}`);

    // Fetch event details and inventory from Mercury
    const [eventDetails, inventory] = await Promise.all([
      mercuryAPI.getEvent(eventId),
      mercuryAPI.getInventory({ eventId })
    ]);

    if (!eventDetails) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Filter inventory by requested quantity
    const availableOptions = inventory.filter(ticket =>
      ticket.splits?.includes(quantity) || ticket.quantity === quantity
    );

    console.log(`[Seat Options] Found ${availableOptions.length} options for quantity ${quantity}`);

    // Calculate price categories based on price distribution
    const prices = availableOptions.map(t => t.price).filter(p => p > 0).sort((a, b) => a - b);
    const minPrice = prices[0] || 0;
    const maxPrice = prices[prices.length - 1] || 0;
    const priceRange = maxPrice - minPrice;

    // Transform to seat options with price categories
    const seatOptions: SeatOption[] = availableOptions.map(ticket => {
      // Determine price category
      let priceCategory: 'low' | 'medium' | 'high' | 'premium';
      if (priceRange === 0) {
        priceCategory = 'medium';
      } else {
        const percentile = ((ticket.price - minPrice) / priceRange) * 100;
        if (percentile <= 25) priceCategory = 'low';
        else if (percentile <= 50) priceCategory = 'medium';
        else if (percentile <= 75) priceCategory = 'high';
        else priceCategory = 'premium';
      }

      // Format seat range
      let seatRange = '';
      if (ticket.seatNumbers && ticket.seatNumbers.length >= 2) {
        seatRange = `${ticket.seatNumbers[0]}-${ticket.seatNumbers[1]}`;
      } else if (ticket.quantity > 0) {
        seatRange = `${ticket.quantity} seat${ticket.quantity > 1 ? 's' : ''}`;
      }

      return {
        id: ticket.id,
        section: ticket.section || 'General',
        row: ticket.row || 'GA',
        seats: seatRange,
        quantity: ticket.quantity,
        price: isAdmin ? ticket.price : 0, // Only show actual price to admin
        priceCategory,
        available: ticket.quantity >= quantity
      };
    });

    // Sort by price (lowest to highest)
    seatOptions.sort((a, b) => {
      // For admin, sort by actual price
      if (isAdmin) return a.price - b.price;
      // For users, sort by price category
      const categoryOrder = { 'low': 1, 'medium': 2, 'high': 3, 'premium': 4 };
      return categoryOrder[a.priceCategory] - categoryOrder[b.priceCategory];
    });

    // Format event date and venue
    let eventDate = '';
    if (eventDetails.date) {
      if (typeof eventDetails.date === 'object' && 'datetime' in eventDetails.date) {
        eventDate = new Date((eventDetails.date as any).datetime).toLocaleDateString();
      } else {
        eventDate = new Date(eventDetails.date as string).toLocaleDateString();
      }
    }

    let venue = 'Venue TBA';
    if (eventDetails.venue) {
      if (typeof eventDetails.venue === 'object') {
        venue = eventDetails.venue.name || 'Venue TBA';
        if (eventDetails.venue.city && eventDetails.venue.state) {
          venue += `, ${eventDetails.venue.city}, ${eventDetails.venue.state}`;
        }
      } else {
        venue = eventDetails.venue;
      }
    }

    return NextResponse.json({
      eventId,
      eventName: eventDetails.name || 'Event',
      eventDate,
      venue,
      quantity,
      seatOptions,
      priceRange: {
        min: isAdmin ? minPrice : 0,
        max: isAdmin ? maxPrice : 0
      }
    });

  } catch (error) {
    console.error('[Seat Options] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch seat options',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}