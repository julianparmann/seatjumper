import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { gameId, breakItem } = await req.json();

    if (!gameId || !breakItem) {
      return NextResponse.json(
        { error: 'Game ID and item data are required' },
        { status: 400 }
      );
    }

    // Create a duplicate of the item with the same properties
    // but a new ID and potentially updated status
    const duplicatedItem = await prisma.cardBreak.create({
      data: {
        gameId,
        breakName: breakItem.breakName + ' (Copy)',
        breakValue: breakItem.breakValue || 0,
        breakDateTime: new Date(),
        breaker: breakItem.breaker || 'Admin Import',
        status: 'AVAILABLE', // Always set new duplicates as available
        itemType: breakItem.itemType || 'memorabilia',
        imageUrl: breakItem.imageUrl || null,
        description: breakItem.description || null,
        category: breakItem.category || null,
        spotPrice: breakItem.spotPrice || breakItem.breakValue || 0,
        sourceUrl: breakItem.sourceUrl || null,
        teamName: breakItem.teamName || null,
        breakType: breakItem.breakType || null,
        scrapedAt: new Date()
      }
    });

    // Update game's average break value
    const allBreaks = await prisma.cardBreak.findMany({
      where: { gameId }
    });

    const avgBreakValue = allBreaks.reduce((sum, b) => sum + (b.breakValue || 0), 0) / allBreaks.length;

    await prisma.dailyGame.update({
      where: { id: gameId },
      data: { avgBreakValue }
    });

    return NextResponse.json({
      success: true,
      item: duplicatedItem
    });

  } catch (error) {
    console.error('Duplicate item error:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate item' },
      { status: 500 }
    );
  }
}