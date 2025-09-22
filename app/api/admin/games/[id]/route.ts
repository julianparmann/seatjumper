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
        ticketLevels: true,
        specialPrizes: true,
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
    const { ticketGroups, ticketLevels, specialPrizes, ...gameData } = body;

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

    // Handle ticket levels: create, update, or delete
    if (ticketLevels && Array.isArray(ticketLevels)) {
      // Get existing ticket levels
      const existingLevels = await prisma.ticketLevel.findMany({
        where: { gameId: id }
      });

      // Delete levels that are not in the update
      const levelIdsToKeep = ticketLevels.filter(l => l.id && !l.id.startsWith('new-')).map(l => l.id);
      const levelsToDelete = existingLevels.filter(l => !levelIdsToKeep.includes(l.id));

      for (const levelToDelete of levelsToDelete) {
        await prisma.ticketLevel.delete({
          where: { id: levelToDelete.id }
        });
      }

      // Update or create levels
      for (const level of ticketLevels) {
        if (level.id && level.id.startsWith('new-')) {
          // Create new level
          await prisma.ticketLevel.create({
            data: {
              gameId: id,
              level: level.level || '',
              levelName: level.levelName || '',
              quantity: level.quantity || 0,
              pricePerSeat: level.pricePerSeat || 0,
              viewImageUrl: level.viewImageUrl,
              sections: level.sections || [],
              isSelectable: level.isSelectable !== false
            }
          });
        } else if (level.id) {
          // Update existing level
          await prisma.ticketLevel.update({
            where: { id: level.id },
            data: {
              level: level.level,
              levelName: level.levelName,
              quantity: level.quantity,
              pricePerSeat: level.pricePerSeat,
              viewImageUrl: level.viewImageUrl,
              sections: level.sections,
              isSelectable: level.isSelectable
            }
          });
        }
      }
    }

    // Handle special prizes: create, update, or delete
    if (specialPrizes && Array.isArray(specialPrizes)) {
      // Get existing special prizes
      const existingPrizes = await prisma.specialPrize.findMany({
        where: { gameId: id }
      });

      // Delete prizes that are not in the update
      const prizeIdsToKeep = specialPrizes.filter(p => p.id && !p.id.startsWith('new-')).map(p => p.id);
      const prizesToDelete = existingPrizes.filter(p => !prizeIdsToKeep.includes(p.id));

      for (const prizeToDelete of prizesToDelete) {
        await prisma.specialPrize.delete({
          where: { id: prizeToDelete.id }
        });
      }

      // Update or create prizes
      for (const prize of specialPrizes) {
        if (prize.id && prize.id.startsWith('new-')) {
          // Create new prize
          await prisma.specialPrize.create({
            data: {
              gameId: id,
              name: prize.name || '',
              description: prize.description || '',
              value: prize.value || 0,
              quantity: prize.quantity || 0,
              imageUrl: prize.imageUrl,
              prizeType: prize.prizeType || 'EXPERIENCE',
              metadata: prize.metadata
            }
          });
        } else if (prize.id) {
          // Update existing prize
          await prisma.specialPrize.update({
            where: { id: prize.id },
            data: {
              name: prize.name,
              description: prize.description,
              value: prize.value,
              quantity: prize.quantity,
              imageUrl: prize.imageUrl,
              prizeType: prize.prizeType
            }
          });
        }
      }
    }

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
              notes: group.notes,
              seatViewUrl: group.seatViewUrl
            }
          });
        }
      }
    }

    // Recalculate pricing based on available inventory
    const allTicketGroups = await prisma.ticketGroup.findMany({
      where: { gameId: id }
    });

    const allCardBreaks = await prisma.cardBreak.findMany({
      where: { gameId: id }
    });

    // Use the new inventory-aware pricing calculation
    const { calculateBundlePricing } = await import('@/lib/pricing');
    const pricing = calculateBundlePricing(allTicketGroups, allCardBreaks, 30);

    // Update game with new prices
    const finalGame = await prisma.dailyGame.update({
      where: { id },
      data: {
        avgTicketPrice: pricing.avgTicketPrice,
        avgBreakValue: pricing.avgBreakValue,
        spinPricePerBundle: pricing.spinPricePerBundle
      },
      include: {
        ticketGroups: true,
        ticketLevels: true,
        specialPrizes: true,
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