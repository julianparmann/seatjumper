import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, section, row, quantity, pricePerSeat, status, notes, seatViewUrl } = body;

    const ticketGroup = await prisma.ticketGroup.create({
      data: {
        gameId,
        section,
        row,
        quantity: quantity || 1,
        pricePerSeat: pricePerSeat || 0,
        status: status || 'AVAILABLE',
        notes,
        seatViewUrl
      }
    });

    return NextResponse.json(ticketGroup);
  } catch (error: any) {
    console.error('Error creating ticket group:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket group', details: error?.message },
      { status: 500 }
    );
  }
}