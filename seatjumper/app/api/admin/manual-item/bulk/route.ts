import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { gameId, title, price, imageUrl, itemLink, quantity } = await req.json();

    if (!gameId || !title || price === undefined || !quantity) {
      return NextResponse.json(
        { error: 'Game ID, title, price, and quantity are required' },
        { status: 400 }
      );
    }

    // Use createMany for better performance with large quantities
    const itemData = Array.from({ length: quantity }, () => ({
      gameId,
      breakName: title,
      breakValue: price,
      breakDateTime: new Date(),
      breaker: 'Manual Entry',
      status: 'AVAILABLE' as const,
      itemType: 'memorabilia',
      imageUrl: imageUrl || null,
      description: title,
      category: 'memorabilia',
      spotPrice: price,
      sourceUrl: itemLink || null,
      scrapedAt: new Date(),
      quantity: 1
    }));

    // Batch insert for efficiency
    const result = await prisma.cardBreak.createMany({
      data: itemData,
      skipDuplicates: false
    });

    // Update game's average break value
    const allBreaks = await prisma.cardBreak.findMany({
      where: { gameId, status: 'AVAILABLE' }
    });

    const avgBreakValue = allBreaks.reduce((sum, b) => sum + (b.breakValue || 0), 0) / allBreaks.length;

    await prisma.dailyGame.update({
      where: { id: gameId },
      data: { avgBreakValue }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully added ${quantity} units of ${title}`,
      itemsAdded: quantity,
      totalItems: allBreaks.length
    });

  } catch (error) {
    console.error('Bulk manual item entry error:', error);
    return NextResponse.json(
      { error: 'Failed to add items' },
      { status: 500 }
    );
  }
}