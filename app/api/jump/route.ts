import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mailgunService } from '@/lib/email/mailgun';
import { render } from '@react-email/render';
import OrderReceiptEmail from '@/lib/email/templates/order-receipt';

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

    // Start a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get the game with available inventory
      const game = await tx.dailyGame.findUnique({
        where: { id: gameId },
        include: {
          ticketLevels: {
            where: {
              quantity: { gt: 0 },
              ...(selectedLevels.length > 0 ? { level: { in: selectedLevels } } : { isSelectable: true })
            }
          },
          specialPrizes: {
            where: {
              quantity: { gt: 0 }
            }
          },
          cardBreaks: {
            where: {
              status: 'AVAILABLE'
            }
          }
        }
      });

      if (!game) {
        throw new Error('Game not found');
      }

      // Build the complete inventory pool with equal probability
      const inventoryPool: any[] = [];

      // Add all available tickets from selected levels
      game.ticketLevels.forEach(level => {
        for (let i = 0; i < level.quantity; i++) {
          inventoryPool.push({
            type: 'ticket',
            id: level.id,
            level: level.level,
            levelName: level.levelName,
            value: level.pricePerSeat,
            sections: level.sections,
            viewImageUrl: level.viewImageUrl
          });
        }
      });

      // Add special prizes to pool (filter based on quantity requested)
      game.specialPrizes.forEach(prize => {
        // If buying multiple bundles, only include special prizes that have enough quantity
        // This ensures seats are together (all same level) for multi-bundle purchases
        if (quantity > 1 && prize.quantity < quantity) {
          // Skip this prize - not enough for all bundles
          return;
        }

        for (let i = 0; i < prize.quantity; i++) {
          inventoryPool.push({
            type: 'special',
            id: prize.id,
            name: prize.name,
            description: prize.description,
            value: prize.value,
            imageUrl: prize.imageUrl,
            prizeType: prize.prizeType,
            metadata: prize.metadata
          });
        }
      });

      // Add all card breaks/memorabilia
      game.cardBreaks.forEach(cardBreak => {
        inventoryPool.push({
          type: 'memorabilia',
          id: cardBreak.id,
          name: cardBreak.breakName,
          value: cardBreak.breakValue,
          imageUrl: cardBreak.imageUrl,
          description: cardBreak.description,
          itemType: cardBreak.itemType
        });
      });

      // Check if we have enough items for the requested bundles
      if (inventoryPool.length < quantity * 2) { // Each bundle needs 1 ticket/prize + 1 memorabilia
        throw new Error(`Not enough inventory available. Need ${quantity * 2} items but only ${inventoryPool.length} available`);
      }

      // Shuffle the pool for random selection
      const shuffled = [...inventoryPool].sort(() => Math.random() - 0.5);

      // Create bundles
      const bundles = [];
      const itemsToUpdate = {
        ticketLevels: new Map<string, number>(),
        specialPrizes: new Map<string, number>(),
        cardBreaks: [] as string[]
      };

      // For multi-bundle purchases, ensure same ticket level for all (seats together)
      let fixedTicketLevel: string | null = null;
      let fixedSpecialPrize: string | null = null;

      for (let i = 0; i < quantity; i++) {
        let ticketItem = null;

        if (quantity > 1) {
          // Multi-bundle: ensure same seating level for all bundles
          if (i === 0) {
            // First bundle: randomly select a level/prize
            let ticketIndex = shuffled.findIndex(item => item.type === 'ticket' || item.type === 'special');
            if (ticketIndex !== -1) {
              ticketItem = shuffled.splice(ticketIndex, 1)[0];
              if (ticketItem.type === 'ticket') {
                fixedTicketLevel = ticketItem.level;
              } else if (ticketItem.type === 'special') {
                fixedSpecialPrize = ticketItem.id;
              }
            }
          } else {
            // Subsequent bundles: use same level/prize as first
            if (fixedTicketLevel) {
              let ticketIndex = shuffled.findIndex(item =>
                item.type === 'ticket' && item.level === fixedTicketLevel
              );
              if (ticketIndex !== -1) {
                ticketItem = shuffled.splice(ticketIndex, 1)[0];
              }
            } else if (fixedSpecialPrize) {
              let ticketIndex = shuffled.findIndex(item =>
                item.type === 'special' && item.id === fixedSpecialPrize
              );
              if (ticketIndex !== -1) {
                ticketItem = shuffled.splice(ticketIndex, 1)[0];
              }
            }
          }
        } else {
          // Single bundle: random selection as before
          let ticketIndex = shuffled.findIndex(item => item.type === 'ticket' || item.type === 'special');
          if (ticketIndex !== -1) {
            ticketItem = shuffled.splice(ticketIndex, 1)[0];
          }
        }

        if (ticketItem) {
          // Track inventory updates
          if (ticketItem.type === 'ticket') {
            itemsToUpdate.ticketLevels.set(
              ticketItem.id,
              (itemsToUpdate.ticketLevels.get(ticketItem.id) || 0) + 1
            );
          } else if (ticketItem.type === 'special') {
            itemsToUpdate.specialPrizes.set(
              ticketItem.id,
              (itemsToUpdate.specialPrizes.get(ticketItem.id) || 0) + 1
            );
          }
        }

        // Select a memorabilia item
        let memorabiliaItem = null;
        let memorabiliaIndex = shuffled.findIndex(item => item.type === 'memorabilia');

        if (memorabiliaIndex !== -1) {
          memorabiliaItem = shuffled.splice(memorabiliaIndex, 1)[0];
          itemsToUpdate.cardBreaks.push(memorabiliaItem.id);
        }

        // Create the bundle
        if (ticketItem && memorabiliaItem) {
          bundles.push({
            ticket: ticketItem.type === 'ticket' ? {
              level: ticketItem.level,
              levelName: ticketItem.levelName,
              value: ticketItem.value,
              sections: ticketItem.sections,
              viewImageUrl: ticketItem.viewImageUrl
            } : {
              special: true,
              name: ticketItem.name,
              description: ticketItem.description,
              value: ticketItem.value,
              prizeType: ticketItem.prizeType,
              imageUrl: ticketItem.imageUrl
            },
            memorabilia: {
              name: memorabiliaItem.name,
              value: memorabiliaItem.value,
              imageUrl: memorabiliaItem.imageUrl,
              description: memorabiliaItem.description
            }
          });
        }
      }

      if (bundles.length !== quantity) {
        throw new Error('Unable to create all requested bundles');
      }

      // Update inventory quantities
      for (const [levelId, count] of itemsToUpdate.ticketLevels) {
        await tx.ticketLevel.update({
          where: { id: levelId },
          data: { quantity: { decrement: count } }
        });
      }

      for (const [prizeId, count] of itemsToUpdate.specialPrizes) {
        await tx.specialPrize.update({
          where: { id: prizeId },
          data: { quantity: { decrement: count } }
        });
      }

      // Mark card breaks as sold
      if (itemsToUpdate.cardBreaks.length > 0) {
        await tx.cardBreak.updateMany({
          where: { id: { in: itemsToUpdate.cardBreaks } },
          data: { status: 'SOLD' }
        });
      }

      // Calculate total value and average price
      const totalValue = bundles.reduce((sum, bundle) => {
        const ticketValue = bundle.ticket.value || 0;
        const memorabiliaValue = bundle.memorabilia.value || 0;
        return sum + ticketValue + memorabiliaValue;
      }, 0);

      // Calculate the price based on what's actually available for selection
      // Build the actual eligible pool (same logic as inventory building but filtered)
      const eligiblePool = [];

      // Add eligible tickets
      game.ticketLevels.forEach(level => {
        for (let i = 0; i < level.quantity; i++) {
          eligiblePool.push({
            type: 'ticket',
            value: level.pricePerSeat
          });
        }
      });

      // Add eligible special prizes (only if quantity is sufficient for all bundles)
      game.specialPrizes.forEach(prize => {
        if (quantity <= 1 || prize.quantity >= quantity) {
          for (let i = 0; i < prize.quantity; i++) {
            eligiblePool.push({
              type: 'special',
              value: prize.value
            });
          }
        }
      });

      // Add all memorabilia
      game.cardBreaks.forEach(cardBreak => {
        eligiblePool.push({
          type: 'memorabilia',
          value: cardBreak.breakValue
        });
      });

      const poolTotalValue = eligiblePool.reduce((sum, item) => sum + item.value, 0);
      const avgPricePerItem = poolTotalValue / eligiblePool.length;
      const pricePerBundle = avgPricePerItem * 2 * 1.3; // Each bundle has 2 items + 30% margin

      // Create SpinResult record
      const spinResult = await tx.spinResult.create({
        data: {
          gameId,
          userId: session.user.id,
          quantity,
          totalPrice: pricePerBundle * quantity,
          totalValue,
          paidAt: new Date(), // Temporarily mark as paid until Stripe integration
          adjacentSeats: false, // Not applicable in level-based system
          bundles: {
            create: bundles.map(bundle => ({
              ticketSection: bundle.ticket.level || bundle.ticket.name || '',
              ticketRow: bundle.ticket.levelName || bundle.ticket.prizeType || '',
              ticketValue: bundle.ticket.value,
              ticketQuantity: 1,
              breaks: [bundle.memorabilia],
              bundleValue: bundle.ticket.value + bundle.memorabilia.value
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
          name: bundle.memorabilia.name,
          value: bundle.memorabilia.value || 0,
          description: bundle.memorabilia.description
        }));

        const emailHtml = render(OrderReceiptEmail({
          userName: spinResult.user.name || spinResult.user.email.split('@')[0],
          orderNumber: spinResult.id,
          eventName: spinResult.game.eventName,
          eventDate: spinResult.game.eventDate,
          venue: spinResult.game.venue,
          city: spinResult.game.city,
          state: spinResult.game.state,
          pricePaid: pricePerBundle * quantity,
          tickets: ticketDetails,
          memorabilia: memorabiliaDetails,
          orderDate: new Date()
        }));

        await mailgunService.sendTemplatedEmail(
          spinResult.user.email,
          `Order Confirmation - ${spinResult.game.eventName}`,
          emailHtml,
          undefined,
          { tags: ['order-receipt', 'jump-complete'] }
        );

        console.log(`Order receipt email sent to ${spinResult.user.email} for spin ${spinResult.id}`);
      } catch (emailError) {
        console.error('Failed to send order receipt email:', emailError);
        // Don't fail the jump if email fails
      }

      // Return the bundle details
      return {
        quantity,
        bundles,
        totalValue,
        totalPrice: pricePerBundle * quantity,
        spinId: spinResult.id,
        averagePoolValue: avgPricePerItem
      };
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