import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { scrapeGame } from '@/lib/scrapers/tickpick';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: gameId } = await params;

    // Get game details
    const game = await prisma.dailyGame.findUnique({
      where: { id: gameId }
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    console.log(`Starting scrape for game: ${game.eventName}`);

    // Run the scraper
    const tickets = await scrapeGame(gameId, game.tickpickUrl, game.sport);

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: 'SCRAPE_TICKETS',
        resource: 'DailyGame',
        resourceId: gameId,
        details: {
          ticketCount: tickets.length,
          url: game.tickpickUrl
        }
      }
    });

    return NextResponse.json({
      success: true,
      ticketCount: tickets.length,
      tickets: tickets.slice(0, 10) // Return first 10 for preview
    });
  } catch (error) {
    console.error('Error scraping tickets:', error);
    return NextResponse.json(
      { error: 'Failed to scrape tickets', details: error },
      { status: 500 }
    );
  }
}