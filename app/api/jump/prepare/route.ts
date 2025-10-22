import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Creates a placeholder jump purchase record after successful Stripe checkout
 * This ensures the user can see their purchase immediately, even if the webhook is delayed
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, eventId, quantity, jumpPrice } = body;

    if (!sessionId || !eventId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log(`[Jump Prepare] Creating placeholder for session ${sessionId}`);

    // Check if record already exists
    const existing = await prisma.jumpPurchase.findUnique({
      where: { stripeSessionId: sessionId }
    });

    if (existing) {
      console.log(`[Jump Prepare] Record already exists for session ${sessionId}`);
      return NextResponse.json({ success: true, id: existing.id });
    }

    // Create placeholder record
    const jumpPurchase = await prisma.jumpPurchase.create({
      data: {
        id: `jump_temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: session.user.id,
        eventId,
        stripeSessionId: sessionId,
        quantity: quantity || 1,
        jumpPrice: jumpPrice || 0,
        status: 'pending', // Will be updated by webhook
        createdAt: new Date()
      }
    });

    console.log(`[Jump Prepare] Created placeholder ${jumpPurchase.id} for session ${sessionId}`);

    return NextResponse.json({
      success: true,
      id: jumpPurchase.id
    });

  } catch (error) {
    console.error('[Jump Prepare] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to prepare jump purchase',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}