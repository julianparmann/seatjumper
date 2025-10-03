import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createCheckoutSession } from '@/lib/stripe';
import { calculateBundleSpecificPricing } from '@/lib/pricing';

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { gameId, quantity = 1, selectedLevels = [], selectedPack = 'blue' } = await req.json();

    if (!gameId) {
      return NextResponse.json({ error: 'Game ID required' }, { status: 400 });
    }

    if (quantity < 1 || quantity > 4) {
      return NextResponse.json({ error: 'Invalid quantity. Must be between 1 and 4.' }, { status: 400 });
    }

    // Fetch game details with pricing information
    const game = await prisma.dailyGame.findUnique({
      where: { id: gameId },
      include: {
        ticketLevels: true,
        ticketGroups: true,
        specialPrizes: true,
        cardBreaks: true,
        stadium: true
      }
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Calculate dynamic pricing based on current inventory and selected pack
    const bundleSpecificPricing = calculateBundleSpecificPricing(
      game.ticketLevels,
      game.ticketGroups,
      game.specialPrizes,
      game.cardBreaks,
      30, // 30% margin
      selectedPack // Pass the selected pack for pack-specific pricing
    );

    // Get the price for the selected quantity
    const priceKey = `spinPrice${quantity}x` as keyof typeof bundleSpecificPricing;
    const bundlePrice = bundleSpecificPricing[priceKey];

    console.log('Stripe checkout pricing debug:', {
      selectedPack,
      quantity,
      priceKey,
      bundleSpecificPricing,
      bundlePrice,
      ticketLevelsCount: game.ticketLevels.length,
      ticketGroupsCount: game.ticketGroups.length,
      specialPrizesCount: game.specialPrizes.length,
      cardBreaksCount: game.cardBreaks.length,
      availableCardBreaksCount: game.cardBreaks.filter((cb: any) => cb.status === 'AVAILABLE').length,
      // Detailed pricing breakdown
      calculatedValuePerBundle: bundlePrice ? Math.round(bundlePrice / 1.3) : 0,
      margin: '30%',
      finalPrice: bundlePrice
    });

    if (!bundlePrice || bundlePrice <= 0) {
      return NextResponse.json({ error: 'Unable to calculate price. Insufficient inventory.' }, { status: 400 });
    }

    // Create pending spin result to track the checkout session
    const pendingSpinResult = await prisma.spinResult.create({
      data: {
        id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        gameId,
        userId: session.user.id,
        quantity,
        totalPrice: bundlePrice,
        totalValue: 0, // Will be calculated upon successful payment
        paymentStatus: 'PENDING',
        adjacentSeats: false
      }
    });

    // Create Stripe checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.headers.get('origin')}`;
    const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/play/${gameId}?canceled=true`;

    const checkoutSession = await createCheckoutSession(
      [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${game.eventName} - ${quantity}x Bundle${quantity > 1 ? 's' : ''} (${selectedPack.charAt(0).toUpperCase() + selectedPack.slice(1)} Pack)`,
              description: `${quantity} ticket bundle${quantity > 1 ? 's' : ''} for ${game.eventName} on ${new Date(game.eventDate).toLocaleDateString()} - ${selectedPack.charAt(0).toUpperCase() + selectedPack.slice(1)} Pack`,
              metadata: {
                gameId,
                quantity: quantity.toString(),
                eventName: game.eventName,
                selectedPack
              }
            },
            unit_amount: Math.round(bundlePrice * 100) // Convert to cents
          },
          quantity: 1
        }
      ],
      successUrl,
      cancelUrl,
      {
        gameId,
        userId: session.user.id,
        quantity: quantity.toString(),
        selectedLevels: selectedLevels.join(','),
        selectedPack,
        spinResultId: pendingSpinResult.id
      },
      session.user.email || undefined
    );

    // Update pending spin result with Stripe session ID
    await prisma.spinResult.update({
      where: { id: pendingSpinResult.id },
      data: {
        stripeSessionId: checkoutSession.id
      }
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    });

  } catch (error: any) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}