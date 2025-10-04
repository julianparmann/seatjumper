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
    // Filter out VIP backup items (tierPriority > 1)
    const game = await prisma.dailyGame.findUnique({
      where: { id: gameId },
      include: {
        ticketLevels: {
          where: {
            OR: [
              { tierLevel: { not: 'VIP_ITEM' } },
              {
                AND: [
                  { tierLevel: 'VIP_ITEM' },
                  { tierPriority: 1 }
                ]
              }
            ]
          }
        },
        ticketGroups: {
          where: {
            OR: [
              { tierLevel: { not: 'VIP_ITEM' } },
              {
                AND: [
                  { tierLevel: 'VIP_ITEM' },
                  { tierPriority: 1 }
                ]
              }
            ]
          }
        },
        specialPrizes: true,
        cardBreaks: {
          where: {
            OR: [
              { tierLevel: { not: 'VIP_ITEM' } },
              {
                AND: [
                  { tierLevel: 'VIP_ITEM' },
                  { tierPriority: 1 }
                ]
              }
            ]
          }
        },
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

    // Validate inventory availability for selected quantity
    // Note: VIP backup items are already filtered out in the query above
    const eligibleTicketLevels = game.ticketLevels.filter((item: any) => {
      const availableUnits = item.availableUnits as number[] || [1, 2, 3, 4];
      const availablePacks = item.availablePacks as string[] || ['blue', 'red', 'gold'];
      const hasQuantity = item.quantity >= quantity;
      const hasAvailableUnits = availableUnits.includes(quantity);
      const hasAvailablePack = availablePacks.includes(selectedPack);
      return hasQuantity && hasAvailableUnits && hasAvailablePack;
    });

    const eligibleTicketGroups = game.ticketGroups.filter((item: any) => {
      const availableUnits = item.availableUnits as number[] || [1, 2, 3, 4];
      const availablePacks = item.availablePacks as string[] || ['blue', 'red', 'gold'];
      const isAvailable = item.status === 'AVAILABLE';
      const hasQuantity = item.quantity >= quantity;
      const hasAvailableUnits = availableUnits.includes(quantity);
      const hasAvailablePack = availablePacks.includes(selectedPack);
      return isAvailable && hasQuantity && hasAvailableUnits && hasAvailablePack;
    });

    const eligibleSpecialPrizes = game.specialPrizes.filter((item: any) => {
      const availableUnits = item.availableUnits as number[] || [1, 2, 3, 4];
      const hasQuantity = item.quantity >= quantity;
      const hasAvailableUnits = availableUnits.includes(quantity);
      // Special prizes typically aren't pack-specific
      return hasQuantity && hasAvailableUnits;
    });

    const eligibleTickets = [...eligibleTicketLevels, ...eligibleTicketGroups, ...eligibleSpecialPrizes];

    const eligibleMemorabilia = game.cardBreaks.filter((item: any) => {
      const availableUnits = item.availableUnits as number[] || [1, 2, 3, 4];
      const availablePacks = item.availablePacks as string[] || ['blue', 'red', 'gold'];
      // For memorabilia, we just need to check if item is available - we'll check total quantity later
      const hasAvailableUnits = availableUnits.includes(quantity);
      const hasAvailablePack = availablePacks.includes(selectedPack);

      return item.status === 'AVAILABLE' && item.quantity > 0 && hasAvailableUnits && hasAvailablePack;
    });

    console.log('Stripe checkout pricing debug:', {
      selectedPack,
      quantity,
      priceKey,
      bundleSpecificPricing,
      bundlePrice,
      eligibleTicketsCount: eligibleTickets.length,
      eligibleMemorabiliaCount: eligibleMemorabilia.length,
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

    // Check if we have sufficient inventory for the requested quantity
    if (eligibleTickets.length === 0 || eligibleMemorabilia.length < quantity) {
      console.error('Insufficient inventory for requested quantity:', {
        quantity,
        selectedPack,
        eligibleTickets: eligibleTickets.length,
        eligibleMemorabilia: eligibleMemorabilia.length
      });
      return NextResponse.json({
        error: `Insufficient inventory for ${quantity}x ${selectedPack} bundle. Please try a smaller quantity or different pack.`,
        details: {
          requestedQuantity: quantity,
          availableTickets: eligibleTickets.length,
          availableMemorabilia: eligibleMemorabilia.length
        }
      }, { status: 400 });
    }

    if (!bundlePrice || bundlePrice <= 0) {
      return NextResponse.json({ error: 'Unable to calculate price. Insufficient inventory.' }, { status: 400 });
    }

    // Debug: Log user session info
    console.log('Creating SpinResult with user:', {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      hasSession: !!session,
      hasUser: !!session?.user
    });

    // Skip SpinResult creation for now - let's fix the user issue first
    const pendingSpinResultId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Would create SpinResult with ID:', pendingSpinResultId);

    // TODO: Fix user foreign key constraint issue
    /*
    // Create pending spin result to track the checkout session
    const pendingSpinResult = await prisma.spinResult.create({
      data: {
        id: pendingSpinResultId,
        gameId,
        userId: session.user.id,
        quantity,
        totalPrice: bundlePrice,
        totalValue: 0, // Will be calculated upon successful payment
        paymentStatus: 'PENDING',
        adjacentSeats: false,
        selectedPack
      }
    });
    */

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
        spinResultId: pendingSpinResultId
      },
      session.user.email || undefined
    );

    // Skip updating pending spin result for now
    /*
    // Update pending spin result with Stripe session ID
    await prisma.spinResult.update({
      where: { id: pendingSpinResultId },
      data: {
        stripeSessionId: checkoutSession.id
      }
    });
    */

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    });

  } catch (error: any) {
    console.error('Checkout session creation error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      },
      { status: 500 }
    );
  }
}