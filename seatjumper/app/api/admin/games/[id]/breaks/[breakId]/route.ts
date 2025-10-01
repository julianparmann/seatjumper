import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; breakId: string }> }
) {
  try {
    const { id: gameId, breakId } = await params;

    // Check if the item exists before trying to delete
    const existingItem = await prisma.cardBreak.findUnique({
      where: { id: breakId }
    });

    if (!existingItem) {
      // Item doesn't exist, but that's okay - treat as success
      return NextResponse.json({ success: true, message: 'Item already deleted' });
    }

    // Delete the specific break item
    await prisma.cardBreak.delete({
      where: { id: breakId }
    });

    // Update game's average break value
    const allBreaks = await prisma.cardBreak.findMany({
      where: { gameId }
    });

    if (allBreaks.length > 0) {
      const avgBreakValue = allBreaks.reduce((sum, b) => sum + (b.breakValue || 0), 0) / allBreaks.length;

      await prisma.dailyGame.update({
        where: { id: gameId },
        data: { avgBreakValue }
      });
    } else {
      // If no breaks left, set average to 0
      await prisma.dailyGame.update({
        where: { id: gameId },
        data: { avgBreakValue: 0 }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // If it's a "record not found" error, treat as success
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: true, message: 'Item already deleted' });
    }

    console.error('Error deleting break item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}