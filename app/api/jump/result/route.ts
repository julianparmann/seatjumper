import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { mercuryAPI } from '@/lib/api/mercury';

export async function GET(request: NextRequest) {
  try {
    console.log('[Jump Result API] Starting request');

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('[Jump Result API] No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Jump Result API] User authenticated:', session.user.id);

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`[Jump Result API] Looking for purchase with sessionId: ${sessionId}`);

    // Fetch the jump purchase by Stripe session ID
    const jumpPurchase = await prisma.jumpPurchase.findUnique({
      where: {
        stripeSessionId: sessionId
      },
      include: {
        user: true
      }
    });

    if (!jumpPurchase) {
      console.log(`[Jump Result API] No purchase found for session ${sessionId}`);

      // Check if there are any jump purchases for this user (for debugging)
      const userPurchases = await prisma.jumpPurchase.findMany({
        where: {
          userId: session.user.id
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`[Jump Result API] User has ${userPurchases.length} total jump purchases`);
      if (userPurchases.length > 0) {
        console.log(`[Jump Result API] Recent session IDs:`, userPurchases.map(p => p.stripeSessionId));
      }

      return NextResponse.json(
        { error: 'Jump purchase not found. The payment may still be processing.' },
        { status: 404 }
      );
    }

    // Verify the purchase belongs to the current user
    if (jumpPurchase.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to this purchase' },
        { status: 403 }
      );
    }

    // Use stored event details first, then fallback to Mercury API
    let eventDetails = null;

    // First try to use the stored event details
    if (jumpPurchase.eventName) {
      eventDetails = {
        eventName: jumpPurchase.eventName,
        eventDate: jumpPurchase.eventDate,
        venue: jumpPurchase.eventVenue || 'Venue TBA'
      };
    }
    // Fallback to fetching from Mercury if not stored
    else if (jumpPurchase.eventId) {
      try {
        const event = await mercuryAPI.getEvent(jumpPurchase.eventId);
        if (event) {
          eventDetails = {
            eventName: event.name,
            eventDate: event.date,
            venue: typeof event.venue === 'object' ? event.venue.name : event.venue
          };
        }
      } catch (error) {
        console.error('Failed to fetch event details:', error);
        // Continue without event details
      }
    }

    // Return the jump purchase data
    return NextResponse.json({
      id: jumpPurchase.id,
      eventId: jumpPurchase.eventId,
      section: jumpPurchase.section,
      row: jumpPurchase.row,
      quantity: jumpPurchase.quantity,
      jumpPrice: jumpPurchase.jumpPrice,
      wholesalePrice: jumpPurchase.wholesalePrice,
      mercuryOrderId: jumpPurchase.mercuryOrderId,
      mercuryLockId: jumpPurchase.mercuryLockId,
      ticketGroupId: jumpPurchase.ticketGroupId,
      status: jumpPurchase.status,
      createdAt: jumpPurchase.createdAt,
      completedAt: jumpPurchase.completedAt,
      error: jumpPurchase.error,
      selectedSeats: jumpPurchase.selectedSeats,
      ...eventDetails
    });

  } catch (error) {
    console.error('[Jump Result API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch jump result',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}