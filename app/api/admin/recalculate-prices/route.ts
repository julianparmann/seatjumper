import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // Fetch all games with their ticket groups
    const games = await prisma.dailyGame.findMany({
      include: {
        ticketGroups: true
      }
    });

    const updates = [];

    for (const game of games) {
      // Calculate weighted average ticket price
      let avgTicketPrice = 0;

      if (game.ticketGroups.length > 0) {
        const totalValue = game.ticketGroups.reduce((sum, group) => {
          return sum + (group.pricePerSeat * group.quantity);
        }, 0);

        const totalTickets = game.ticketGroups.reduce((sum, group) => {
          return sum + group.quantity;
        }, 0);

        avgTicketPrice = totalTickets > 0 ? totalValue / totalTickets : 0;
      }

      // Calculate spin price with 35% margin
      const spinPricePerBundle = avgTicketPrice * 1.35;

      // Update the game
      const updated = await prisma.dailyGame.update({
        where: { id: game.id },
        data: {
          avgTicketPrice,
          spinPricePerBundle
        }
      });

      updates.push({
        gameId: game.id,
        eventName: game.eventName,
        oldAvgPrice: game.avgTicketPrice,
        newAvgPrice: avgTicketPrice,
        oldSpinPrice: game.spinPricePerBundle,
        newSpinPrice: spinPricePerBundle
      });
    }

    return NextResponse.json({
      success: true,
      gamesUpdated: updates.length,
      updates
    });
  } catch (error: any) {
    console.error('Error recalculating prices:', error);
    return NextResponse.json(
      {
        error: 'Failed to recalculate prices',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}