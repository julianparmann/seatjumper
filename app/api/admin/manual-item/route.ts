import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { markPoolsAsStale } from '@/lib/services/prize-pool-service';

export async function POST(req: Request) {
  try {
    const { gameId, title, price, imageUrl, itemLink } = await req.json();

    if (!gameId || !title || price === undefined) {
      return NextResponse.json(
        { error: 'Game ID, title, and price are required' },
        { status: 400 }
      );
    }

    // Create a CardBreak entry for the manually added item
    const cardBreak = await prisma.cardBreak.create({
      data: {
        gameId,
        breakName: title,
        breakValue: price,
        breakDateTime: new Date(),
        breaker: 'Manual Entry',
        status: 'AVAILABLE',
        itemType: 'memorabilia',
        imageUrl: imageUrl || null,
        description: title,
        category: 'memorabilia',
        spotPrice: price,
        sourceUrl: itemLink || null,
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

    // Regenerate prize pools after inventory change
    markPoolsAsStale(gameId).catch(error => {
      console.error('Error regenerating prize pools after manual item:', error);
    });

    return NextResponse.json({
      success: true,
      item: {
        id: cardBreak.id,
        name: cardBreak.breakName,
        price: cardBreak.breakValue,
        imageUrl: cardBreak.imageUrl
      }
    });

  } catch (error) {
    console.error('Manual item entry error:', error);
    return NextResponse.json(
      { error: 'Failed to add item' },
      { status: 500 }
    );
  }
}