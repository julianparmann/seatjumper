import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

    // Build where clause - show all SpinResults by default
    let whereClause: any = {};

    if (status === 'pending') {
      whereClause.OR = [
        { ticketsTransferred: false },
        { memorabiliaShipped: false }
      ];
    }

    // Get total count
    const total = await prisma.spinResult.count({
      where: whereClause
    });

    // Get paginated orders
    const orders = await prisma.spinResult.findMany({
      where: whereClause,
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
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    return NextResponse.json({
      orders,
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