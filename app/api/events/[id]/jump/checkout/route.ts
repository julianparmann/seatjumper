import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';
import { mercuryAPI } from '@/lib/api/mercury';
import { calculateJumpPrices, groupBySection } from '@/lib/utils/jump-calculator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const { quantity = 2, excludedSections = [], selectedTicketIds = [] } = body;

    console.log(`[Jump Checkout] Creating checkout for event ${eventId}, quantity: ${quantity}`);

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

    // Transform Mercury inventory to our format
    const ticketGroups = inventory.map(ticket => ({
      exchangeTicketGroupId: parseInt(ticket.id) || 0,
      section: ticket.section || 'General',
      row: ticket.row || '',
      availableQuantity: ticket.quantity || 0,
      purchasableQuantities: ticket.splits || [ticket.quantity],
      unitPrice: {
        wholesalePrice: {
          value: ticket.price || 0,
          currencyCode: 'USD'
        },
        retailPrice: ticket.retailPrice ? {
          value: ticket.retailPrice,
          currencyCode: 'USD'
        } : undefined
      },
      standardSection: ticket.section,
      canonicalSection: ticket.section
    }));

    // Filter to only selected ticket IDs if provided, otherwise filter by excluded sections
    let selectedGroups = ticketGroups;
    if (selectedTicketIds.length > 0) {
      // User has specifically selected ticket IDs
      selectedGroups = ticketGroups.filter(g =>
        selectedTicketIds.includes(g.exchangeTicketGroupId.toString())
      );
    } else if (excludedSections.length > 0) {
      // Fall back to section-based filtering
      selectedGroups = ticketGroups.filter(g =>
        !excludedSections.includes(g.standardSection || g.section)
      );
    }

    if (selectedGroups.length === 0) {
      return NextResponse.json(
        { error: 'No inventory available for selected sections' },
        { status: 400 }
      );
    }

    // Calculate jump price
    const marginPercent = parseInt(process.env.JUMP_MARGIN_PERCENT || '30');
    const jumpPrices = calculateJumpPrices(selectedGroups, marginPercent, false);
    const jumpPrice = jumpPrices.find(p => p.quantity === quantity);

    if (!jumpPrice) {
      return NextResponse.json(
        { error: `No pricing available for quantity ${quantity}` },
        { status: 400 }
      );
    }

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

    // Create Stripe checkout session with extra params in success URL
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/jump/success?session_id={CHECKOUT_SESSION_ID}&event_id=${eventId}&quantity=${quantity}&price=${jumpPrice.jumpPrice}`;

    const checkoutSession = await createCheckoutSession(
      [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `SeatJumper - ${eventDetails.name || 'Event'}`,
            description: `${quantity} seat${quantity !== 1 ? 's' : ''} - ${eventDate} at ${venue}`,
            metadata: {
              eventId,
              eventName: eventDetails.name || 'Event',
              quantity: quantity.toString(),
            }
          },
          unit_amount: jumpPrice.jumpPrice * 100, // Convert to cents
        },
        quantity: 1,
      }],
      successUrl,
      `${process.env.NEXT_PUBLIC_APP_URL}/play-v2/${eventId}?canceled=true`,
      {
        eventId,
        eventName: eventDetails.name || 'Event',
        eventVenue: venue,
        eventDate: eventDate,
        userId: session.user.id,
        quantity: quantity.toString(),
        excludedSections: excludedSections.join(','),
        selectedTicketIds: selectedTicketIds.join(','),
        jumpPrice: jumpPrice.jumpPrice.toString(),
        poolSize: jumpPrice.poolSize.toString(),
        wholesaleAvg: jumpPrice.wholesalePrice?.toString() || '0', // For internal tracking only
      },
      session.user.email || undefined
    );

    console.log(`[Jump Checkout] Created Stripe session ${checkoutSession.id} for event ${eventId}`);

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
      jumpPrice: jumpPrice.jumpPrice,
      quantity,
      eventName: eventDetails.name,
      poolSize: jumpPrice.poolSize,
    });

  } catch (error) {
    console.error('[Jump Checkout] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}