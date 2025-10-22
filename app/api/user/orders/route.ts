import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { mercuryAPI } from '@/lib/api/mercury';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch regular spin results
    const spinResults = await prisma.spinResult.findMany({
      where: {
        userId: session.user.id,
        paymentStatus: 'COMPLETED'
      },
      include: {
        game: true,
        bundles: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fetch Mercury jump purchases (including pending ones that just completed payment)
    const jumpPurchases = await prisma.jumpPurchase.findMany({
      where: {
        userId: session.user.id,
        status: {
          in: ['pending', 'completed', 'requires_fulfillment']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Enrich jump purchases with event details
    const enrichedJumpPurchases = await Promise.all(
      jumpPurchases.map(async (purchase) => {
        // First try to use the stored event details
        if (purchase.eventName) {
          return {
            ...purchase,
            type: 'jump',
            eventName: purchase.eventName,
            eventDate: purchase.eventDate,
            venue: purchase.eventVenue || 'Venue TBA'
          };
        }

        // Fallback to fetching from Mercury API if not stored
        let eventDetails = null;
        try {
          if (purchase.eventId) {
            const event = await mercuryAPI.getEvent(purchase.eventId);
            if (event) {
              eventDetails = {
                eventName: event.name,
                eventDate: event.date,
                venue: typeof event.venue === 'object'
                  ? `${event.venue.name}, ${event.venue.city}, ${event.venue.state}`
                  : event.venue
              };
            }
          }
        } catch (error) {
          console.error(`Failed to fetch event details for ${purchase.eventId}:`, error);
        }

        return {
          ...purchase,
          type: 'jump',
          ...eventDetails
        };
      })
    );

    // Transform spin results to a consistent format
    const transformedSpins = spinResults.map(spin => ({
      id: spin.id,
      type: 'spin',
      eventName: spin.game.eventName,
      eventDate: spin.game.eventDate,
      venue: `${spin.game.venue}, ${spin.game.city}, ${spin.game.state}`,
      quantity: spin.quantity,
      totalPrice: spin.totalPrice,
      totalValue: spin.totalValue,
      createdAt: spin.createdAt,
      status: 'completed',
      ticketsTransferred: spin.ticketsTransferred,
      memorabiliaShipped: spin.memorabiliaShipped,
      bundles: spin.bundles
    }));

    // Combine and sort all orders by date
    const allOrders = [...transformedSpins, ...enrichedJumpPurchases].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      orders: allOrders,
      totalOrders: allOrders.length,
      spinCount: transformedSpins.length,
      jumpCount: enrichedJumpPurchases.length
    });

  } catch (error) {
    console.error('[User Orders API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch orders',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}