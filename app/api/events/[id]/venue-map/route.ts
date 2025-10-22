import { NextRequest, NextResponse } from 'next/server';
import { mercuryAPI } from '@/lib/api/mercury';
import { seaticsAPI, formatMercuryTicketsForSeatics } from '@/lib/api/seatics';
import { seaticsMercuryMapper } from '@/lib/services/seatics-mercury-mapper';

export interface VenueMapResponse {
  eventId: string;
  eventName: string;
  venue: string;
  eventDate: string;
  mapData: {
    hasMap: boolean;
    mapImage?: string;
    seaticsData?: any;
    sections: any[];
  };
  inventory: {
    totalTickets: number;
    priceRange: {
      min: number;
      max: number;
    };
    sections: any[];
  };
  error?: string;
}

/**
 * Fetch venue map data from Seatics and merge with Mercury inventory
 * This provides the data needed to render the interactive venue map
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    console.log(`[Venue Map] Fetching map data for event ${eventId}`);

    // Fetch event details and inventory from Mercury in parallel
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

    // Format event date for Seatics (yyyyMMddHHmm)
    let seaticsDateTime = '';
    if (eventDetails.date) {
      const dateObj = typeof eventDetails.date === 'object' && eventDetails.date.datetime
        ? new Date(eventDetails.date.datetime)
        : new Date(eventDetails.date);

      // Format as yyyyMMddHHmm
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hour = String(dateObj.getHours()).padStart(2, '0');
      const minute = String(dateObj.getMinutes()).padStart(2, '0');
      seaticsDateTime = `${year}${month}${day}${hour}${minute}`;
    } else {
      // Default to a future date if date is missing
      const now = new Date();
      now.setDate(now.getDate() + 7); // 7 days from now
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      seaticsDateTime = `${year}${month}${day}2000`; // 8 PM default
    }

    // Fetch Seatics map data
    // Note: We may need to use event name + venue for better matching
    const venueName = typeof eventDetails.venue === 'object'
      ? eventDetails.venue.name
      : eventDetails.venue;

    console.log(`[Venue Map] Fetching Seatics data for ${eventDetails.name} at ${venueName}`);

    let seaticsData = null;
    try {
      seaticsData = await seaticsAPI.getEventAndVenueInfo({
        eventName: eventDetails.name,
        venue: venueName || '',
        dateTime: seaticsDateTime
      });
    } catch (seaticsError) {
      console.warn('[Venue Map] Seatics fetch failed, continuing without map:', seaticsError);
      // Continue without map data - we can still show inventory
    }

    // Map Mercury inventory to sections
    const mappedData = seaticsMercuryMapper.mapInventoryToSections(
      inventory,
      seaticsData?.sections || [],
      new Set() // Start with all sections selected
    );

    // Format response
    const response: VenueMapResponse = {
      eventId,
      eventName: eventDetails.name || 'Event',
      venue: venueName || 'Venue',
      eventDate: seaticsDateTime,
      mapData: {
        hasMap: !!seaticsData?.mapData,
        mapImage: seaticsData?.eventInfo?.mapImage,
        seaticsData: seaticsData?.mapData,
        sections: seaticsData?.sections || [],
      },
      inventory: {
        totalTickets: inventory.length,
        priceRange: mappedData.priceRange,
        sections: mappedData.sections.map(section => ({
          name: section.mercurySection,
          seaticsId: section.seaticsId,
          displayName: section.displayName,
          ticketCount: section.ticketCount,
          availableQuantities: section.availableQuantities,
          priceRange: section.priceRange,
          priceCategory: section.priceCategory,
          color: section.color,
          viewFromSeatUrl: section.viewFromSeatUrl,
          isSelected: section.isSelected,
          // Include a few sample tickets for the UI
          sampleTickets: section.tickets.slice(0, 3).map(t => ({
            id: t.id,
            row: t.row,
            seats: t.seatNumbers?.join('-'),
            quantity: t.quantity,
            price: t.price
          }))
        }))
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Venue Map] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch venue map data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to get formatted ticket data for Seatics map component
 * Takes selected sections and returns formatted ticket array
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { selectedSections = [] } = body;

    console.log(`[Venue Map] Formatting tickets for sections:`, selectedSections);

    // Fetch current inventory
    const inventory = await mercuryAPI.getInventory({ eventId });

    // Filter to selected sections
    const selectedSet = new Set(selectedSections);
    const filteredInventory = selectedSections.length > 0
      ? inventory.filter(ticket => selectedSet.has(ticket.section))
      : inventory;

    // Format for Seatics map display
    const formattedTickets = formatMercuryTicketsForSeatics(filteredInventory);

    return NextResponse.json({
      tickets: formattedTickets,
      count: formattedTickets.length,
      sections: selectedSections
    });

  } catch (error) {
    console.error('[Venue Map] Error formatting tickets:', error);
    return NextResponse.json(
      {
        error: 'Failed to format ticket data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}