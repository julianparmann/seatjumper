import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;

    // Fetch comprehensive user data
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        addresses: {
          orderBy: { isDefault: 'desc' }
        },
        spinResults: {
          include: {
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
            bundles: true
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        sessions: {
          orderBy: { expires: 'desc' },
          take: 5
        },
        accounts: {
          select: {
            provider: true,
            type: true
          }
        },
        profile: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate statistics
    const totalSpent = user.spinResults.reduce((sum, result) => sum + result.totalPrice, 0);
    const totalValue = user.spinResults.reduce((sum, result) => sum + result.totalValue, 0);
    const totalBundles = user.spinResults.reduce((sum, result) => sum + result.quantity, 0);
    const averageSpendPerJump = user.spinResults.length > 0 ? totalSpent / user.spinResults.length : 0;
    const roi = totalSpent > 0 ? ((totalValue - totalSpent) / totalSpent) * 100 : 0;

    // Recent activity
    const recentJumps = user.spinResults.slice(0, 5).map(result => ({
      id: result.id,
      eventName: result.game.eventName,
      eventDate: result.game.eventDate,
      venue: result.game.venue,
      city: result.game.city,
      state: result.game.state,
      quantity: result.quantity,
      jumpPrice: (result.game.spinPricePerBundle || 0) * result.quantity, // Use actual jump price
      totalPrice: result.totalPrice, // Keep for backward compatibility
      totalValue: result.totalValue,
      createdAt: result.createdAt,
      ticketsTransferred: result.ticketsTransferred,
      ticketsTransferredAt: result.ticketsTransferredAt,
      memorabiliaShipped: result.memorabiliaShipped,
      memorabiliaShippedAt: result.memorabiliaShippedAt,
      trackingNumber: result.trackingNumber,
      shippingCarrier: result.shippingCarrier,
      bundles: result.bundles
    }));

    // Account security info
    const lastSession = user.sessions[0];
    const authMethods = user.accounts.map(account => ({
      provider: account.provider,
      type: account.type
    }));

    // Build response
    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      isAdmin: user.isAdmin,
      emailVerified: user.emailVerified,
      phone: user.phone,
      stripeCustomerId: user.stripeCustomerId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,

      // Profile information
      profile: user.profile ? {
        dateOfBirth: user.profile.dateOfBirth,
        preferredSport: user.profile.preferredSport,
        notifyEmail: user.profile.notifyEmail,
        notifySms: user.profile.notifySms,
        marketingEmails: user.profile.marketingEmails
      } : null,

      // Addresses
      addresses: user.addresses.map(addr => ({
        id: addr.id,
        type: addr.type,
        isDefault: addr.isDefault,
        fullName: addr.fullName,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
        country: addr.country,
        phone: addr.phone
      })),

      // Statistics
      stats: {
        totalJumps: user.spinResults.length,
        totalSpent,
        totalValue,
        totalBundles,
        averageSpendPerJump,
        roi,
        memberSince: user.createdAt,
        lastActive: lastSession?.expires || user.spinResults[0]?.createdAt || null
      },

      // Recent activity
      recentJumps,

      // Security
      security: {
        lastLogin: lastSession?.expires || null,
        authMethods,
        hasPassword: !!user.password,
        emailVerified: !!user.emailVerified
      },

      // Orders
      recentOrders: user.orders.slice(0, 5).map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        amount: order.amount,
        createdAt: order.createdAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt
      }))
    };

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}