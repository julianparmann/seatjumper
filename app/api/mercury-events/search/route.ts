import { NextRequest, NextResponse } from 'next/server';
import { mercuryIntegrationService } from '@/lib/services/mercury-integration-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const featured = searchParams.get('featured') === 'true';
    const sport = searchParams.get('sport') || undefined;
    const venue = searchParams.get('venue') || undefined;

    // If featured, use a default popular query
    const searchQuery = featured ? 'NFL NBA MLB NHL' : query;

    if (!searchQuery) {
      return NextResponse.json(
        { error: 'Search query required' },
        { status: 400 }
      );
    }

    // Build filters
    const filters: any = {};
    if (sport) filters.sport = sport;
    if (venue) filters.venue = venue;

    // Search events using Mercury integration service
    const events = await mercuryIntegrationService.searchEvents(searchQuery, filters);

    return NextResponse.json({
      events,
      count: events.length,
      query: searchQuery,
    });
  } catch (error) {
    console.error('[Events Search API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to search events', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
