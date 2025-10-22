import { NextRequest, NextResponse } from 'next/server';
import { mercuryIntegrationService } from '@/lib/services/mercury-integration-service';
import { getSportFromMercuryEvent } from '@/lib/utils/sport-mapper';
import { mercuryAPI } from '@/lib/api/mercury';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const sport = searchParams.get('sport') || undefined;

    console.log('[Mercury Events API] Fetching events with query:', query, 'sport:', sport);

    // Search for events from Mercury
    const rawEvents = await mercuryIntegrationService.searchEvents(query, {
      sport: sport
    });

    // Validate that we got an array back
    if (!Array.isArray(rawEvents)) {
      console.error('[Mercury Events API] Invalid response - not an array:', rawEvents);
      return NextResponse.json(
        { error: 'Invalid Mercury response - expected array' },
        { status: 500 }
      );
    }

    console.log('[Mercury Events API] Found', rawEvents.length, 'raw events');

    // Enrich events with sport detection (without fetching inventory for now)
    const enrichedEvents = rawEvents.map((event) => {
      // Detect sport from event data
      const detectedSport = getSportFromMercuryEvent(event);

      return {
        ...event,
        sport: detectedSport,
        // Mock pricing for now - will be populated when we have real auth
        minPrice: 50,
        maxPrice: 500,
        averagePrice: 200,
        inventoryCount: 100,
      };
    });

    console.log('[Mercury Events API] Returning', enrichedEvents.length, 'enriched events');

    return NextResponse.json({ events: enrichedEvents });
  } catch (error) {
    console.error('[Mercury Events API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch events',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}