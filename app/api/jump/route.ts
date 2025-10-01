import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mailgunService } from '@/lib/email/mailgun';
import { render } from '@react-email/render';
import OrderReceiptEmail from '@/lib/email/templates/order-receipt';
import { getRandomAvailablePool, claimPool, regenerateSinglePool, ensurePoolsAvailable } from '@/lib/services/prize-pool-service';
import { markItemsAsSold } from '@/lib/services/inventory-service';
import { decrementVipInventory } from '@/lib/services/vip-tier-service';

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to jump' }, { status: 401 });
    }

    const { gameId, quantity = 1, selectedLevels = [] } = await req.json();

    if (!gameId) {
      return NextResponse.json({ error: 'Game ID required' }, { status: 400 });
    }

    // Check pool health and regenerate if needed
    await ensurePoolsAvailable(gameId, quantity);

    // Try to use pre-generated pool for instant response
    const pool = await getRandomAvailablePool(gameId, quantity);

    if (!pool) {
      // No pre-generated pools available even after health check
      console.error(`[JUMP] No pools available for game ${gameId} size ${quantity} even after health check`);
      return NextResponse.json(
        {
          error: 'No inventory available',
          message: 'Please try again in a moment as inventory is being refreshed'
        },
        { status: 503 }
      );
    }

    // Use pre-generated pool for instant response
    const result = await prisma.$transaction(async (tx) => {
      // Claim the pool
      await claimPool(pool.id, session.user.id);

      // Mark the items in this pool as sold to prevent duplicate wins
      await markItemsAsSold(pool.id);

      // Get the game details for the email
      const game = await tx.dailyGame.findUnique({
        where: { id: gameId },
        include: {
          stadium: true
        }
      });

      if (!game) {
        throw new Error('Game not found');
      }

      // Extract bundles and pricing from the pre-generated pool
      const bundles = pool.bundles as any[];
      const totalValue = pool.totalValue;
      const totalPrice = pool.totalPrice;

      // Create SpinResult record
      const spinResult = await tx.spinResult.create({
        data: {
          id: `spin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          gameId,
          userId: session.user.id,
          quantity,
          totalPrice,
          totalValue,
          paidAt: new Date(), // Temporarily mark as paid until Stripe integration
          adjacentSeats: false, // Will be determined by actual ticket allocation
          bundles: {
            create: bundles.map((bundle, idx) => ({
              id: `bundle_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
              ticketSection: bundle.ticket.level || bundle.ticket.section || bundle.ticket.name || '',
              ticketRow: bundle.ticket.levelName || bundle.ticket.row || bundle.ticket.prizeType || '',
              ticketValue: bundle.ticket.value,
              ticketQuantity: 1,
              breaks: bundle.memorabilia ? [{
                id: bundle.memorabilia.id,
                name: bundle.memorabilia.name,
                value: bundle.memorabilia.value,
                description: bundle.memorabilia.description,
                imageUrl: bundle.memorabilia.imageUrl
              }] : [],
              bundleValue: bundle.ticket.value + (bundle.memorabilia?.value || 0)
            }))
          }
        },
        include: {
          bundles: true,
          game: true,
          user: true
        }
      });

      // Send order receipt email
      try {
        // Prepare ticket details for email
        const ticketDetails = bundles.map(bundle => {
          if (bundle.ticket.level) {
            // Regular ticket
            return {
              section: bundle.ticket.level,
              row: bundle.ticket.levelName || 'TBD',
              seat: 'TBD', // Specific seats assigned later
              pricePerSeat: bundle.ticket.value || 0
            };
          } else if (bundle.ticket.individual) {
            // Individual ticket from ticketGroup
            return {
              section: bundle.ticket.section,
              row: bundle.ticket.row,
              seat: 'TBD',
              pricePerSeat: bundle.ticket.value || 0
            };
          } else {
            // Special prize (not a regular ticket)
            return {
              section: 'Special Prize',
              row: bundle.ticket.name,
              seat: bundle.ticket.prizeType || '',
              pricePerSeat: bundle.ticket.value || 0
            };
          }
        });

        // Prepare memorabilia details for email
        const memorabiliaDetails = bundles.map(bundle => ({
          name: bundle.memorabilia?.name || 'Memorabilia Item',
          value: bundle.memorabilia?.value || 0,
          description: bundle.memorabilia?.description || ''
        }));

        const emailHtml = await render(OrderReceiptEmail({
          userName: spinResult.user.name || spinResult.user.email.split('@')[0],
          orderNumber: spinResult.id,
          eventName: spinResult.game.eventName,
          eventDate: spinResult.game.eventDate,
          venue: spinResult.game.venue,
          city: spinResult.game.city,
          state: spinResult.game.state,
          pricePaid: totalPrice,
          tickets: ticketDetails,
          memorabilia: memorabiliaDetails,
          orderDate: new Date()
        }) as any) as string;

        await mailgunService.sendTemplatedEmail(
          spinResult.user.email,
          `Order Confirmation - ${spinResult.game.eventName}`,
          emailHtml,
          undefined,
          { tags: ['order-receipt', 'jump-complete'] }
        );

      } catch (emailError) {
        console.error('Failed to send order receipt email:', emailError);
        // Don't fail the jump if email fails
      }

      // Check if any VIP tier items were won and handle inventory/backups
      for (const bundle of bundles) {
        if (bundle.ticket?.tierLevel === 'VIP_ITEM' && bundle.ticket?.tierPriority === 1) {
          // This is a primary VIP item - decrement inventory and potentially promote backup
          const isTicketLevel = bundle.ticket.level !== undefined;
          await decrementVipInventory(bundle.ticket.id, isTicketLevel);
        }
      }

      // Return the bundle details
      return {
        quantity,
        bundles,
        totalValue,
        totalPrice,
        spinId: spinResult.id,
        averagePoolValue: totalValue / quantity // Average per bundle (tickets only)
      };
    });

    // Regenerate a pool in the background to replace the claimed one
    regenerateSinglePool(gameId, quantity).catch(error => {
      console.error('Error regenerating pool:', error);
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Jump error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process jump',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}