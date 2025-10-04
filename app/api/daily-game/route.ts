import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get the active game for today
    const activeGame = await prisma.dailyGame.findFirst({
      where: {
        isActive: true,
        eventDate: {
          gt: new Date() // Event date hasn't passed yet
        }
      },
      include: {
        _count: {
          select: {
            entries: true,
            ticketGroups: true,
            cardBreaks: true
          }
        },
        ticketGroups: {
          where: {
            AND: [
              { status: 'AVAILABLE' },
              {
                OR: [
                  { tierLevel: { not: 'VIP_ITEM' } },
                  {
                    AND: [
                      { tierLevel: 'VIP_ITEM' },
                      { tierPriority: 1 }
                    ]
                  }
                ]
              }
            ]
          },
          select: {
            pricePerSeat: true,
            section: true,
            row: true,
            quantity: true,
            tierLevel: true,
            tierPriority: true
          },
          orderBy: {
            pricePerSeat: 'asc'
          }
        }
      }
    });

    if (!activeGame) {
      return NextResponse.json({ game: null });
    }

    // Get price range from ticket groups
    const prices = activeGame.ticketGroups.map(t => t.pricePerSeat);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    const isAuthenticated = !!session?.user?.id;

    return NextResponse.json({
      game: {
        id: activeGame.id,
        eventName: activeGame.eventName,
        eventDate: activeGame.eventDate,
        venue: activeGame.venue,
        city: activeGame.city,
        state: activeGame.state,
        sport: activeGame.sport,
        maxEntries: activeGame.maxEntries,
        currentEntries: activeGame.currentEntries,
        entryCount: activeGame._count.entries,
        availableTickets: activeGame._count.ticketGroups,
        availableBreaks: activeGame._count.cardBreaks,
        minPrice,
        maxPrice,
        isAuthenticated
      }
    });
  } catch (error) {
    console.error('Error fetching daily game:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily game' },
      { status: 500 }
    );
  }
}

// Join the daily game
// TODO: Implement this when GameEntry model is added
/*
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Must be logged in' }, { status: 401 });
    }

    const body = await request.json();
    const { gameId, ticketQty, breakQty } = body;

    // Verify game is active
    const game = await prisma.dailyGame.findUnique({
      where: { id: gameId },
      include: {
        _count: {
          select: {
            participants: true
          }
        }
      }
    });

    if (!game || !game.isActive) {
      return NextResponse.json({ error: 'Game not available' }, { status: 400 });
    }

    if (game._count.participants >= game.maxPlayers) {
      return NextResponse.json({ error: 'Game is full' }, { status: 400 });
    }

    if (new Date() > game.cutoffTime) {
      return NextResponse.json({ error: 'Registration closed' }, { status: 400 });
    }

    // Calculate price (simplified for MVP)
    const ticketPrice = ticketQty * 150; // Average ticket price
    const breakPrice = breakQty * 50; // Average break price
    const totalPrice = Math.round((ticketPrice + breakPrice) * 0.35); // 35% of value

    // Create participant
    const participant = await prisma.gameParticipant.create({
      data: {
        gameId,
        userId: session.user.id,
        ticketQty: ticketQty || 2,
        breakQty: breakQty || 1,
        paidAmount: totalPrice,
        status: 'pending'
      }
    });

    return NextResponse.json({
      success: true,
      participant,
      paymentRequired: totalPrice
    });
  } catch (error) {
    console.error('Error joining game:', error);
    return NextResponse.json(
      { error: 'Failed to join game' },
      { status: 500 }
    );
  }
}
*/