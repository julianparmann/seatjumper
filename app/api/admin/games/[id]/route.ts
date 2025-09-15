import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id: gameId } = await params;

    const updateData: any = {};

    // Only update fields that were provided
    if (body.eventName !== undefined) updateData.eventName = body.eventName;
    if (body.eventDate !== undefined) updateData.eventDate = new Date(body.eventDate);
    if (body.venue !== undefined) updateData.venue = body.venue;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.tickpickUrl !== undefined) updateData.tickpickUrl = body.tickpickUrl;
    if (body.sport !== undefined) updateData.sport = body.sport;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.cutoffTime !== undefined) updateData.cutoffTime = new Date(body.cutoffTime);
    if (body.minPlayers !== undefined) updateData.minPlayers = body.minPlayers;
    if (body.maxPlayers !== undefined) updateData.maxPlayers = body.maxPlayers;

    const game = await prisma.dailyGame.update({
      where: { id: gameId },
      data: updateData
    });

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_GAME',
        resource: 'DailyGame',
        resourceId: gameId,
        details: body
      }
    });

    return NextResponse.json({ game });
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: gameId } = await params;

    // Delete related data first
    await prisma.scrapedTicket.deleteMany({
      where: { gameId }
    });

    await prisma.gameParticipant.deleteMany({
      where: { gameId }
    });

    // Delete the game
    await prisma.dailyGame.delete({
      where: { id: gameId }
    });

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE_GAME',
        resource: 'DailyGame',
        resourceId: gameId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 }
    );
  }
}