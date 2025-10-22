import { NextRequest, NextResponse } from 'next/server';
import { mercuryAPI } from '@/lib/api/mercury';
import {
  calculateJumpPrices,
  groupBySection,
  type MercuryTicketGroup,
  type JumpPriceResult,
  type SectionSummary
} from '@/lib/utils/jump-calculator';

export interface CalculateJumpRequest {
  selectedGroupIds?: number[]; // Exchange ticket group IDs to include
  excludedSections?: string[]; // Sections to exclude
}

export interface CalculateJumpResponse {
  eventId: string;
  eventName: string;
  eventDate: string;
  venue: string;
  sections: SectionSummary[];
  jumpPrices: JumpPriceResult[];
  poolSize: number;
  error?: string;
}

/**
 * Calculate jump prices for an event based on user's seat selection
 * Never exposes wholesale prices - only returns final jump prices
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body: CalculateJumpRequest = await request.json();
    const isAdmin = request.nextUrl.searchParams.get('admin') === 'true';

    console.log(`[Calculate Jump] Event ${eventId}, Request:`, body);

    // Fetch event details from Mercury
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

    // Transform Mercury response to our format
    const ticketGroups: MercuryTicketGroup[] = (inventory as any[]).map(ticket => ({
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

    console.log(`[Calculate Jump] Found ${ticketGroups.length} total ticket groups`);

    // Filter based on user selection
    let selectedGroups = ticketGroups;

    // If specific group IDs provided, filter to those
    if (body.selectedGroupIds && body.selectedGroupIds.length > 0) {
      selectedGroups = ticketGroups.filter(g =>
        body.selectedGroupIds!.includes(g.exchangeTicketGroupId)
      );
    }

    // Exclude sections if specified
    if (body.excludedSections && body.excludedSections.length > 0) {
      selectedGroups = selectedGroups.filter(g =>
        !body.excludedSections!.includes(g.standardSection || g.section)
      );
    }

    console.log(`[Calculate Jump] ${selectedGroups.length} groups after filtering`);

    // Get margin from environment (default 30%)
    const marginPercent = parseInt(process.env.JUMP_MARGIN_PERCENT || '30');

    // Calculate jump prices for available quantities
    const jumpPrices = calculateJumpPrices(selectedGroups, marginPercent, isAdmin);

    // Group all available sections for UI
    const sections = groupBySection(ticketGroups, isAdmin);

    // Format event date
    let eventDate = '';
    if (eventDetails.date) {
      if (typeof eventDetails.date === 'object' && 'datetime' in eventDetails.date) {
        eventDate = new Date((eventDetails.date as any).datetime).toLocaleDateString();
      } else {
        eventDate = new Date(eventDetails.date as string).toLocaleDateString();
      }
    }

    // Format venue
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

    const response: CalculateJumpResponse = {
      eventId,
      eventName: eventDetails.name || 'Event',
      eventDate,
      venue,
      sections,
      jumpPrices,
      poolSize: selectedGroups.length
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Calculate Jump] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate jump prices',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get initial jump prices for an event (all inventory)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const isAdmin = request.nextUrl.searchParams.get('admin') === 'true';

    console.log(`[Calculate Jump] Getting initial prices for event ${eventId}`);

    // Fetch event details and inventory
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

    if (!inventory || inventory.length === 0) {
      return NextResponse.json({
        eventId,
        eventName: eventDetails.name || 'Event',
        eventDate: '',
        venue: '',
        sections: [],
        jumpPrices: [],
        poolSize: 0,
        error: 'No inventory available for this event'
      });
    }

    // Transform to our format
    const ticketGroups: MercuryTicketGroup[] = inventory.map(ticket => ({
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

    // Get margin
    const marginPercent = parseInt(process.env.JUMP_MARGIN_PERCENT || '30');

    // Calculate prices for all inventory
    const jumpPrices = calculateJumpPrices(ticketGroups, marginPercent, isAdmin);

    // Group sections
    const sections = groupBySection(ticketGroups, isAdmin);

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

    const response: CalculateJumpResponse = {
      eventId,
      eventName: eventDetails.name || 'Event',
      eventDate,
      venue,
      sections,
      jumpPrices,
      poolSize: ticketGroups.length
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Calculate Jump] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get jump prices',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}