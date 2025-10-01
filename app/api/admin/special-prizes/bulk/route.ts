import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, specialPrizes } = body;

    console.log('Received special prizes bulk request:', { gameId, count: specialPrizes?.length });
    console.log('First prize:', specialPrizes?.[0]);

    if (!gameId || !specialPrizes || !Array.isArray(specialPrizes)) {
      return NextResponse.json(
        { error: 'Invalid request: gameId and specialPrizes array required' },
        { status: 400 }
      );
    }

    // Prepare data for bulk creation
    const specialPrizeData = specialPrizes.map(prize => ({
      gameId,
      name: prize.name || '',
      description: prize.description || '',
      value: prize.value || 0,
      quantity: prize.quantity || 0,
      imageUrl: prize.imageUrl || null,
      prizeType: prize.prizeType || 'MEMORABILIA',
      metadata: prize.metadata || undefined,
      availableUnits: prize.availableUnits || [1, 2, 3, 4]
    }));

    console.log('Prepared data for insertion:', specialPrizeData[0]);
    console.log('Values being inserted:', specialPrizeData.map(p => ({ name: p.name, value: p.value })));

    // Use createMany for efficient bulk insertion
    const result = await prisma.specialPrize.createMany({
      data: specialPrizeData,
      skipDuplicates: false
    });

    // Fetch the created special prizes to return them
    const createdPrizes = await prisma.specialPrize.findMany({
      where: {
        gameId,
        createdAt: {
          gte: new Date(Date.now() - 5000) // Prizes created in last 5 seconds
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: result.count
    });

    return NextResponse.json({
      count: result.count,
      specialPrizes: createdPrizes
    });
  } catch (error: any) {
    console.error('Error creating special prizes in bulk:', error);
    return NextResponse.json(
      { error: 'Failed to create special prizes', details: error?.message },
      { status: 500 }
    );
  }
}