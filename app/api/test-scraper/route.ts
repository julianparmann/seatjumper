import { NextRequest, NextResponse } from 'next/server';
import { scrapeGame } from '@/lib/scrapers/tickpick';
import { prisma } from '@/lib/db';

// Simple test endpoint that doesn't require authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Create a temporary test game
    const testGameId = `test-${Date.now()}`;

    console.log('Starting test scrape for URL:', url);

    // Try to scrape without saving to database first
    const mockGame = {
      id: testGameId,
      eventName: 'Test Event',
      sport: 'NFL'
    };

    // Real scraping - this will actually visit TickPick and extract data
    let tickets;
    let isRealData = false;
    let errorMessage = '';

    try {
      console.log('Starting REAL scrape of TickPick...');
      tickets = await scrapeGame(testGameId, url, 'NFL');
      console.log(`Real scrape complete! Found ${tickets.length} tickets`);
      isRealData = true;
    } catch (scrapeError: any) {
      console.error('Real scraping failed, using mock data:', scrapeError.message);
      errorMessage = scrapeError.message;
      // Fallback to mock data if real scraping fails
      tickets = [
        { section: '101', row: 'A', seats: ['1', '2'], quantity: 2, price: 450, tier: 'lower' },
        { section: '205', row: 'M', seats: ['10', '11'], quantity: 2, price: 225, tier: 'club' },
        { section: '305', row: 'Z', seats: ['20', '21'], quantity: 2, price: 125, tier: 'upper' },
        { section: 'Field', row: '1', seats: ['5', '6'], quantity: 2, price: 1200, tier: 'field' }
      ];
    }

    return NextResponse.json({
      success: true,
      message: isRealData ? '🎯 REAL DATA from TickPick!' : 'Test scrape successful (using mock data)',
      ticketCount: tickets.length,
      tickets: tickets,
      note: isRealData
        ? '✅ Successfully scraped REAL ticket data from TickPick!'
        : `⚠️ Using mock data. Real scrape error: ${errorMessage}`,
      isRealData
    });

  } catch (error: any) {
    console.error('Test scraper error:', error);
    return NextResponse.json(
      {
        error: 'Scraping failed',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}