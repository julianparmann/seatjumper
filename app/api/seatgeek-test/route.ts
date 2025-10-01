import { NextRequest, NextResponse } from 'next/server';
import { getSeatGeekEvent, SeatGeekAPI } from '@/lib/api/seatgeek';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log('Searching SeatGeek for:', query);

    // Search for the event
    const api = new SeatGeekAPI();
    const searchResult = await api.searchEvents(query, {
      per_page: 10,
      'datetime_utc.gte': new Date().toISOString().split('T')[0]
    });

    if (!searchResult.events || searchResult.events.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No events found',
        query
      });
    }

    // Transform all events
    const events = searchResult.events.map((event: any) => api.transformEvent(event));

    // Get the first event's details for demo
    const firstEvent = events[0];

    return NextResponse.json({
      success: true,
      message: `🎯 Found ${events.length} events on SeatGeek!`,
      query,
      totalEvents: searchResult.meta?.total || events.length,
      events: events.slice(0, 5), // Return first 5 events
      featured: {
        ...firstEvent,
        ticketUrl: `https://seatgeek.com${searchResult.events[0].url}`,
        note: '✅ Real live data from SeatGeek API!'
      },
      priceRange: firstEvent.minPrice ? {
        min: firstEvent.minPrice,
        max: firstEvent.maxPrice,
        avg: firstEvent.averagePrice,
        inventory: firstEvent.inventoryCount
      } : null
    });

  } catch (error: any) {
    console.error('SeatGeek API error:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      note: 'SeatGeek API error - check your query'
    }, { status: 500 });
  }
}

// GET endpoint to test without POST
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || 'raiders chargers';

  try {
    const api = new SeatGeekAPI();
    const result = await api.searchEvents(query, {
      per_page: 5,
      'datetime_utc.gte': new Date().toISOString().split('T')[0]
    });

    return NextResponse.json({
      success: true,
      query,
      events: result.events?.length || 0,
      sample: result.events?.[0] || null,
      note: 'SeatGeek API is working!'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}