import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      gameId,
      breakName,
      breakValue,
      description,
      imageUrl,
      itemType,
      quantity = 1,
      tierLevel,
      tierPriority,
      availableUnits,
      availablePacks
    } = body;

    if (!gameId || !breakName) {
      return NextResponse.json(
        { error: 'gameId and breakName are required' },
        { status: 400 }
      );
    }

    // Create the card break entry
    const cardBreak = await prisma.cardBreak.create({
      data: {
        gameId,
        breakName,
        breakValue: parseFloat(breakValue) || 0,
        breakDateTime: new Date(),
        breaker: 'Admin Import',
        status: 'AVAILABLE',
        itemType: itemType || 'memorabilia',
        imageUrl: imageUrl || null,
        description: description || breakName,
        category: 'card',
        quantity: quantity,
        tierLevel: tierLevel || null,
        tierPriority: tierPriority || null,
        availableUnits: availableUnits || [1, 2, 3, 4],
        availablePacks: availablePacks || ['blue', 'red', 'gold']
      }
    });

    return NextResponse.json(cardBreak);
  } catch (error: any) {
    console.error('Error adding memorabilia:', error);
    return NextResponse.json(
      { error: 'Failed to add memorabilia', details: error?.message },
      { status: 500 }
    );
  }
}