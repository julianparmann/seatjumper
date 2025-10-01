import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
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
    const jumpId = resolvedParams.id;
    const body = await req.json();

    // Verify the jump exists
    const jump = await prisma.spinResult.findUnique({
      where: { id: jumpId }
    });

    if (!jump) {
      return NextResponse.json({ error: 'Jump not found' }, { status: 404 });
    }

    // Build update data based on what's provided
    const updateData: any = {};

    if (typeof body.ticketsTransferred === 'boolean') {
      updateData.ticketsTransferred = body.ticketsTransferred;
      if (body.ticketsTransferred) {
        updateData.ticketsTransferredAt = new Date();
      } else {
        updateData.ticketsTransferredAt = null;
      }
    }

    if (typeof body.memorabiliaShipped === 'boolean') {
      updateData.memorabiliaShipped = body.memorabiliaShipped;
      if (body.memorabiliaShipped) {
        updateData.memorabiliaShippedAt = new Date();
      } else {
        updateData.memorabiliaShippedAt = null;
        updateData.trackingNumber = null;
        updateData.shippingCarrier = null;
      }
    }

    if (body.trackingNumber !== undefined) {
      updateData.trackingNumber = body.trackingNumber || null;
    }

    if (body.shippingCarrier !== undefined) {
      updateData.shippingCarrier = body.shippingCarrier || null;
    }

    // Update the jump
    const updatedJump = await prisma.spinResult.update({
      where: { id: jumpId },
      data: updateData,
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
      }
    });

    return NextResponse.json({
      success: true,
      jump: updatedJump
    });
  } catch (error) {
    console.error('Error updating jump fulfillment:', error);
    return NextResponse.json(
      { error: 'Failed to update fulfillment status' },
      { status: 500 }
    );
  }
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
    const jumpId = resolvedParams.id;

    // Get the jump fulfillment details
    const jump = await prisma.spinResult.findUnique({
      where: { id: jumpId },
      select: {
        id: true,
        ticketsTransferred: true,
        ticketsTransferredAt: true,
        memorabiliaShipped: true,
        memorabiliaShippedAt: true,
        trackingNumber: true,
        shippingCarrier: true,
        game: {
          select: {
            eventName: true,
            eventDate: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!jump) {
      return NextResponse.json({ error: 'Jump not found' }, { status: 404 });
    }

    return NextResponse.json(jump);
  } catch (error) {
    console.error('Error fetching jump fulfillment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fulfillment status' },
      { status: 500 }
    );
  }
}