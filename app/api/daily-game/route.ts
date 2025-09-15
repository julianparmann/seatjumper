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
        cutoffTime: {
          gt: new Date() // Cutoff time hasn't passed yet
        }
      },
      include: {
        _count: {
          select: {
            participants: true,
            scrapedTickets: {
              where: {
                available: true
              }
            }
          }
        },
        scrapedTickets: {
          where: {
            available: true
          },
          select: {
            tier: true,
            price: true,
            section: true,
            row: true
          },
          orderBy: {
            price: 'asc'
          }
        }
      }
    });

    if (!activeGame) {
      return NextResponse.json({ game: null });
    }

    // Get tier distribution for display
    const tierPrices = {
      field: activeGame.scrapedTickets.filter(t => t.tier === 'field')[0]?.price || 0,
      lower: activeGame.scrapedTickets.filter(t => t.tier === 'lower')[0]?.price || 0,
      club: activeGame.scrapedTickets.filter(t => t.tier === 'club')[0]?.price || 0,
      upper: activeGame.scrapedTickets.filter(t => t.tier === 'upper')[0]?.price || 0,
      nosebleed: activeGame.scrapedTickets.filter(t => t.tier === 'nosebleed')[0]?.price || 0,
    };

    // Check if user is already a participant
    const session = await getServerSession(authOptions);
    let isParticipant = false;

    if (session?.user?.id) {
      const participant = await prisma.gameParticipant.findUnique({
        where: {
          gameId_userId: {
            gameId: activeGame.id,
            userId: session.user.id
          }
        }
      });
      isParticipant = !!participant;
    }

    return NextResponse.json({
      game: {
        id: activeGame.id,
        eventName: activeGame.eventName,
        eventDate: activeGame.eventDate,
        venue: activeGame.venue,
        city: activeGame.city,
        state: activeGame.state,
        sport: activeGame.sport,
        cutoffTime: activeGame.cutoffTime,
        minPlayers: activeGame.minPlayers,
        maxPlayers: activeGame.maxPlayers,
        participantCount: activeGame._count.participants,
        availableTickets: activeGame._count.scrapedTickets,
        tierPrices,
        isParticipant
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