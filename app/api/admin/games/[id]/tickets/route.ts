import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;
    const body = await req.json();

    const ticketGroup = await prisma.ticketGroup.create({
      data: {
        gameId,
        section: body.section,
        row: body.row,
        quantity: body.quantity || 1,
        pricePerSeat: body.pricePerSeat,
        notes: body.notes || null,
        seatViewUrl: body.seatViewUrl || null,
        status: 'AVAILABLE'
      }
    });

    return NextResponse.json(ticketGroup);
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;

    const tickets = await prisma.ticketGroup.findMany({
      where: { gameId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(tickets);
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}