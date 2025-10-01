import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count();
    const gameCount = await prisma.dailyGame.count();

    // Try to create a simple game
    const testGame = await prisma.dailyGame.create({
      data: {
        eventName: 'Test Game ' + Date.now(),
        eventDate: new Date(),
        venue: 'Test Venue',
        city: 'Las Vegas',
        state: 'NV',
        sport: 'NFL',
        avgTicketPrice: 100,
        avgBreakValue: null,
        spinPricePerBundle: 135,
        status: 'DRAFT',
      }
    });

    return NextResponse.json({
      success: true,
      userCount,
      gameCount,
      testGameId: testGame.id,
      testGameName: testGame.eventName
    });
  } catch (error: any) {
    console.error('Test API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      meta: error.meta
    }, { status: 500 });
  }
}