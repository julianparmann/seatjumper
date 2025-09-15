import { NextRequest, NextResponse } from 'next/server';
import { getTicketsFromUrl } from '@/lib/api/tickpick-internal';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('Testing TickPick internal API with URL:', url);

    // Use the internal API
    const result = await getTicketsFromUrl(url);

    // Transform listings to our format
    const tickets = result.listings.map((listing: any) => ({
      section: listing.section,
      row: listing.row,
      quantity: listing.quantity,
      price: listing.price,
      tier: determineTier(listing.section, listing.row),
      seats: listing.seats || [],
      listingId: listing.id
    }));

    return NextResponse.json({
      success: true,
      message: `🎯 SUCCESS! Found ${tickets.length} real tickets from TickPick API!`,
      eventId: result.eventId,
      ticketCount: tickets.length,
      tickets: tickets.slice(0, 20), // First 20 tickets
      priceRange: tickets.length > 0 ? {
        min: Math.min(...tickets.map(t => t.price)),
        max: Math.max(...tickets.map(t => t.price)),
        avg: Math.round(tickets.reduce((sum, t) => sum + t.price, 0) / tickets.length)
      } : null,
      note: 'Using TickPick Internal API - Real live data!'
    });

  } catch (error: any) {
    console.error('TickPick API error:', error);

    // Try to provide helpful error info
    let errorMessage = error.message;
    let suggestions = [];

    if (error.message.includes('404')) {
      errorMessage = 'Event not found';
      suggestions.push('Check if the URL is correct');
      suggestions.push('The event might be sold out or removed');
    } else if (error.message.includes('extract event ID')) {
      errorMessage = 'Invalid TickPick URL';
      suggestions.push('Make sure the URL is from tickpick.com');
      suggestions.push('URL should contain an event ID number');
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      suggestions,
      details: error.stack
    }, { status: 500 });
  }
}

function determineTier(section: string, row: string): string {
  const sectionNum = parseInt(section) || 0;
  const sectionLower = section.toLowerCase();

  // Field level sections
  if (sectionLower.includes('field') ||
      sectionLower.includes('court') ||
      sectionLower.includes('floor') ||
      sectionNum < 10) {
    return 'field';
  }

  // Lower bowl (100s)
  if (sectionNum >= 100 && sectionNum < 200) {
    return 'lower';
  }

  // Club level (200s)
  if (sectionNum >= 200 && sectionNum < 300) {
    return 'club';
  }

  // Upper deck (300s)
  if (sectionNum >= 300 && sectionNum < 400) {
    return 'upper';
  }

  // Nosebleeds (400s+)
  if (sectionNum >= 400) {
    return 'nosebleed';
  }

  // Default based on row
  const rowChar = row.charCodeAt(0) - 65;
  if (rowChar <= 5) return 'lower';
  if (rowChar <= 15) return 'club';
  return 'upper';
}