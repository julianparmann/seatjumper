import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Test create received:', body);

    // Create a simple game
    const game = await prisma.dailyGame.create({
      data: {
        eventName: body.eventName || 'Test Event',
        eventDate: new Date(body.eventDate || new Date()),
        venue: body.venue || 'Test Venue',
        city: body.city || 'Test City',
        state: body.state || 'NV',
        sport: body.sport || 'NFL',
        avgTicketPrice: body.avgTicketPrice || 100,
        spinPricePerBundle: body.spinPricePerBundle || 135,
        status: 'DRAFT',
      }
    });

    return NextResponse.json({ success: true, gameId: game.id });
  } catch (error: any) {
    console.error('Test create error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}