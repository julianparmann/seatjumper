import { NextRequest, NextResponse } from 'next/server';
import { retrieveCheckoutSession } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await retrieveCheckoutSession(sessionId);

    if (!checkoutSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Find the spin result associated with this session
    const spinResult = await prisma.spinResult.findFirst({
      where: {
        stripeSessionId: sessionId,
        userId: session.user.id
      },
      include: {
        bundles: true,
        game: true
      }
    });

    if (!spinResult) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      spinId: spinResult.id,
      gameId: spinResult.gameId,
      gameName: spinResult.game.eventName,
      quantity: spinResult.quantity,
      totalPrice: spinResult.totalPrice,
      totalValue: spinResult.totalValue,
      bundles: spinResult.bundles,
      paidAt: spinResult.paidAt,
      paymentStatus: spinResult.paymentStatus || 'COMPLETED',
      selectedPack: spinResult.selectedPack || 'blue'
    });

  } catch (error: any) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { error: 'Failed to verify session', message: error.message },
      { status: 500 }
    );
  }
}