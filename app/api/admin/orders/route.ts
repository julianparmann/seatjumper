import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { mercuryAPI } from '@/lib/api/mercury';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query params
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const status = searchParams.get('status') || 'pending';

    // Fetch spin results
    let spinWhereClause: any = {};
    if (status === 'pending') {
      spinWhereClause.OR = [
        { ticketsTransferred: false },
        { memorabiliaShipped: false }
      ];
    }

    const spinResults = await prisma.spinResult.findMany({
      where: spinWhereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        game: {
          select: {
            eventName: true,
            eventDate: true,
            venue: true,
            city: true,
            state: true,
            spinPricePerBundle: true
          }
        },
        bundles: {
          select: {
            id: true,
            ticketSection: true,
            ticketRow: true,
            ticketQuantity: true,
            ticketValue: true,
            breaks: true,
            bundleValue: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fetch jump purchases
    let jumpWhereClause: any = {
      status: {
        in: ['completed', 'requires_fulfillment']
      }
    };

    if (status === 'pending') {
      jumpWhereClause.AND = [
        { status: { in: ['completed', 'requires_fulfillment'] } },
        {
          OR: [
            { ticketDeliveryStatus: { not: 'delivered' } },
            { ticketDeliveryStatus: null }
          ]
        }
      ];
    }

    const jumpPurchases = await prisma.jumpPurchase.findMany({
      where: jumpWhereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Enrich jump purchases with event details
    const enrichedJumpPurchases = await Promise.all(
      jumpPurchases.map(async (purchase) => {
        let eventDetails: any = {};
        try {
          if (purchase.eventId) {
            const event = await mercuryAPI.getEvent(purchase.eventId);
            if (event) {
              eventDetails = {
                game: {
                  eventName: event.name,
                  eventDate: event.date,
                  venue: typeof event.venue === 'object' ? event.venue.name : event.venue,
                  city: typeof event.venue === 'object' ? event.venue.city : '',
                  state: typeof event.venue === 'object' ? event.venue.state : ''
                }
              };
            }
          }
        } catch (error) {
          console.error(`Failed to fetch event details for ${purchase.eventId}:`, error);
          eventDetails = {
            game: {
              eventName: 'Mercury Event',
              eventDate: purchase.createdAt,
              venue: 'Unknown Venue',
              city: '',
              state: ''
            }
          };
        }

        return {
          ...purchase,
          type: 'jump',
          userId: purchase.userId,
          quantity: purchase.quantity,
          totalPrice: purchase.jumpPrice,
          totalValue: purchase.jumpPrice,
          createdAt: purchase.createdAt,
          paidAt: purchase.completedAt,
          ticketsTransferred: purchase.ticketDeliveryStatus === 'delivered',
          ticketsTransferredAt: purchase.ticketDeliveryStatus === 'delivered' ? purchase.completedAt : null,
          memorabiliaShipped: false, // Jump purchases don't have memorabilia
          memorabiliaShippedAt: null,
          trackingNumber: null,
          shippingCarrier: null,
          bundles: purchase.selectedSeats ? [{
            id: purchase.id,
            ticketSection: (purchase.selectedSeats as any)?.section || purchase.section || 'Various',
            ticketRow: (purchase.selectedSeats as any)?.row || purchase.row || 'Various',
            ticketQuantity: purchase.quantity,
            ticketValue: purchase.jumpPrice,
            breaks: [],
            bundleValue: purchase.jumpPrice
          }] : [],
          ...eventDetails
        };
      })
    );

    // Transform spin results to match the format
    const transformedSpinResults = spinResults.map(spin => ({
      ...spin,
      type: 'spin'
    }));

    // Combine all orders and sort by date
    const allOrders = [...transformedSpinResults, ...enrichedJumpPurchases].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const paginatedOrders = allOrders.slice((page - 1) * pageSize, page * pageSize);
    const total = allOrders.length;

    return NextResponse.json({
      orders: paginatedOrders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}