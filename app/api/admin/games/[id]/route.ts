import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const game = await prisma.dailyGame.findUnique({
      where: { id },
      include: {
        ticketGroups: true,
        cardBreaks: true,
        entries: true,
        spinResults: true,
        stadium: true
      }
    });

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(game);
  } catch (error: any) {
    console.error('Error fetching game:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { ticketGroups, ...gameData } = body;

    // Update game details
    const updatedGame = await prisma.dailyGame.update({
      where: { id },
      data: {
        eventName: gameData.eventName,
        eventDate: gameData.eventDate ? new Date(gameData.eventDate) : undefined,
        venue: gameData.venue,
        city: gameData.city,
        state: gameData.state,
        sport: gameData.sport,
        status: gameData.status
      }
    });

    // Update ticket groups if provided
    if (ticketGroups && Array.isArray(ticketGroups)) {
      for (const group of ticketGroups) {
        if (group.id) {
          // Update existing ticket group
          await prisma.ticketGroup.update({
            where: { id: group.id },
            data: {
              section: group.section,
              row: group.row,
              quantity: group.quantity,
              pricePerSeat: group.pricePerSeat,
              status: group.status,
              notes: group.notes
            }
          });
        }
      }
    }

    // Recalculate average ticket price
    const allTicketGroups = await prisma.ticketGroup.findMany({
      where: { gameId: id }
    });

    let avgTicketPrice = 0;
    if (allTicketGroups.length > 0) {
      const totalValue = allTicketGroups.reduce((sum, group) => {
        return sum + (group.pricePerSeat * group.quantity);
      }, 0);
      const totalTickets = allTicketGroups.reduce((sum, group) => {
        return sum + group.quantity;
      }, 0);
      avgTicketPrice = totalTickets > 0 ? totalValue / totalTickets : 0;
    }

    // Update spin price with 35% margin
    const spinPricePerBundle = avgTicketPrice * 1.35;

    // Update game with new prices
    const finalGame = await prisma.dailyGame.update({
      where: { id },
      data: {
        avgTicketPrice,
        spinPricePerBundle
      },
      include: {
        ticketGroups: true,
        cardBreaks: true
      }
    });

    return NextResponse.json(finalGame);
  } catch (error: any) {
    console.error('Error updating game:', error);
    return NextResponse.json(
      { error: 'Failed to update game', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const game = await prisma.dailyGame.update({
      where: { id },
      data: body
    });

    return NextResponse.json(game);
  } catch (error: any) {
    console.error('Error updating game status:', error);
    return NextResponse.json(
      { error: 'Failed to update game status', details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Delete all related data first (cascade delete)
    await prisma.$transaction(async (tx) => {
      // Delete all card breaks for this game
      await tx.cardBreak.deleteMany({
        where: { gameId: id }
      });

      // Delete all ticket groups for this game
      await tx.ticketGroup.deleteMany({
        where: { gameId: id }
      });

      // Delete all entries for this game
      await tx.gameEntry.deleteMany({
        where: { gameId: id }
      });

      // Delete all spin results for this game
      await tx.spinResult.deleteMany({
        where: { gameId: id }
      });

      // Finally delete the game itself
      await tx.dailyGame.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: 'Game deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting game:', error);
    return NextResponse.json(
      { error: 'Failed to delete game', details: error?.message },
      { status: 500 }
    );
  }
}