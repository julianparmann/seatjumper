import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sanitizeTicketGroups } from '@/lib/utils/image-validator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, ticketGroups } = body;

    console.log(`[BULK API] Received request for gameId ${gameId} with ${ticketGroups?.length || 0} ticket groups`);

    if (!gameId || !ticketGroups || !Array.isArray(ticketGroups)) {
      return NextResponse.json(
        { error: 'Invalid request: gameId and ticketGroups array required' },
        { status: 400 }
      );
    }

    // Sanitize all ticket groups first to ensure no base64 URLs
    const sanitizedGroups = sanitizeTicketGroups(ticketGroups);

    // Prepare data for bulk creation
    const ticketGroupData = sanitizedGroups.map((group, index) => {
      console.log(`[BULK API] Processing ticket ${index}: section=${group.section}, row=${group.row}`);
      console.log(`[BULK API] Ticket ${index} URLs - url1: ${group.seatViewUrl ? 'valid' : 'null'}, url2: ${group.seatViewUrl2 ? 'valid' : 'null'}`);

      return {
        gameId,
        section: group.section || '',
        row: group.row || '',
        quantity: group.quantity || 1,
        pricePerSeat: group.pricePerSeat || 0,
        status: group.status || 'AVAILABLE',
        notes: group.notes || null,
        seatViewUrl: group.seatViewUrl,  // Already sanitized
        seatViewUrl2: group.seatViewUrl2,  // Already sanitized
        availableUnits: group.availableUnits || undefined
      };
    });

    // Use createMany for efficient bulk insertion
    const result = await prisma.ticketGroup.createMany({
      data: ticketGroupData,
      skipDuplicates: false
    });

    // Fetch the created ticket groups to return them
    const createdGroups = await prisma.ticketGroup.findMany({
      where: {
        gameId,
        createdAt: {
          gte: new Date(Date.now() - 5000) // Groups created in last 5 seconds
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: result.count
    });

    return NextResponse.json({
      count: result.count,
      ticketGroups: createdGroups
    });
  } catch (error: any) {
    console.error('Error creating ticket groups in bulk - Full error:', error);
    console.error('Error stack:', error?.stack);

    // Log specific validation errors if present
    if (error?.name === 'PrismaClientValidationError') {
      console.error('Prisma Validation Error Details:', JSON.stringify(error, null, 2));
    }

    return NextResponse.json(
      {
        error: 'Failed to create ticket groups',
        details: error?.message,
        fullError: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
      },
      { status: 500 }
    );
  }
}