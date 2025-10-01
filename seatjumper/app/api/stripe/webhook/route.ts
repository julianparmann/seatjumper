import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { constructWebhookEvent, stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { mailgunService } from '@/lib/email/mailgun';
import { render } from '@react-email/render';
import OrderReceiptEmail from '@/lib/email/templates/order-receipt';
import PaymentFailedEmail from '@/lib/email/templates/payment-failed';
import AbandonedCartEmail from '@/lib/email/templates/abandoned-cart';
import { getRandomAvailablePool, claimPool, regenerateSinglePool, ensurePoolsAvailable } from '@/lib/services/prize-pool-service';
import { markItemsAsSold } from '@/lib/services/inventory-service';
import { decrementVipInventory } from '@/lib/services/vip-tier-service';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature') as string;

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = await constructWebhookEvent(body, signature);
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      try {
        // Get the pending spin result
        const pendingSpinResult = await prisma.spinResult.findFirst({
          where: {
            stripeSessionId: session.id,
            paymentStatus: 'PENDING'
          }
        });

        if (!pendingSpinResult) {
          console.error('No pending spin result found for session:', session.id);
          return NextResponse.json({ error: 'No pending spin result found' }, { status: 404 });
        }

        // Extract metadata
        const gameId = session.metadata?.gameId;
        const userId = session.metadata?.userId;
        const quantity = parseInt(session.metadata?.quantity || '1');
        const selectedLevels = session.metadata?.selectedLevels?.split(',').filter(Boolean) || [];

        if (!gameId || !userId) {
          console.error('Missing required metadata in session:', session.id);
          return NextResponse.json({ error: 'Invalid session metadata' }, { status: 400 });
        }

        // Check pool health and regenerate if needed
        await ensurePoolsAvailable(gameId, quantity);

        // Get a random available pool for this game and quantity
        const pool = await getRandomAvailablePool(gameId, quantity);

        if (!pool) {
          // This is critical - payment succeeded but no inventory
          console.error(`CRITICAL: Payment succeeded but no pools available for game ${gameId} size ${quantity}`);

          // We should create a manual intervention record and notify admin
          await prisma.spinResult.update({
            where: { id: pendingSpinResult.id },
            data: {
              paymentStatus: 'REQUIRES_FULFILLMENT',
              stripePaymentIntentId: session.payment_intent as string,
              paidAt: new Date()
            }
          });

          // TODO: Send admin notification about manual fulfillment needed

          return NextResponse.json(
            { message: 'Payment recorded, manual fulfillment required' },
            { status: 200 }
          );
        }

        // Process the jump with the pre-generated pool
        const result = await prisma.$transaction(async (tx) => {
          // Claim the pool
          await claimPool(pool.id, userId);

          // Mark the items in this pool as sold
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

          // Extract bundles from the pre-generated pool
          const bundles = pool.bundles as any[];
          const totalValue = pool.totalValue;
          const totalPrice = pool.totalPrice;

          // Update the spin result with successful payment and bundle details
          const updatedSpinResult = await tx.spinResult.update({
            where: { id: pendingSpinResult.id },
            data: {
              totalValue,
              paidAt: new Date(),
              paymentStatus: 'COMPLETED',
              stripePaymentIntentId: session.payment_intent as string,
              bundles: {
                create: bundles.map((bundle, idx) => ({
                  id: `bundle_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
                  ticketSection: bundle.ticket.level || bundle.ticket.section || bundle.ticket.name || '',
                  ticketRow: bundle.ticket.levelName || bundle.ticket.row || bundle.ticket.prizeType || '',
                  ticketValue: bundle.ticket.value,
                  ticketQuantity: 1,
                  breaks: [], // Memorabilia removed - tickets only
                  bundleValue: bundle.ticket.value
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
            const user = await tx.user.findUnique({
              where: { id: userId }
            });

            if (user) {
              // Prepare ticket details for email
              const ticketDetails = bundles.map(bundle => {
                if (bundle.ticket.level) {
                  // Regular ticket
                  return {
                    section: bundle.ticket.level,
                    row: bundle.ticket.levelName || 'TBD',
                    seat: 'TBD',
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
                  // Special prize
                  return {
                    section: 'Special Prize',
                    row: bundle.ticket.name,
                    seat: bundle.ticket.prizeType || '',
                    pricePerSeat: bundle.ticket.value || 0
                  };
                }
              });

              const emailHtml = await render(OrderReceiptEmail({
                userName: user.name || user.email.split('@')[0],
                orderNumber: updatedSpinResult.id,
                eventName: game.eventName,
                eventDate: game.eventDate,
                venue: game.venue,
                city: game.city,
                state: game.state,
                pricePaid: totalPrice,
                tickets: ticketDetails,
                memorabilia: [], // No memorabilia (tickets only)
                orderDate: new Date()
              }) as any) as string;

              await mailgunService.sendTemplatedEmail(
                user.email,
                `Order Confirmation - ${game.eventName}`,
                emailHtml,
                undefined,
                { tags: ['order-receipt', 'stripe-payment'] }
              );
            }
          } catch (emailError) {
            console.error('Failed to send order receipt email:', emailError);
            // Don't fail the webhook if email fails
          }

          // Check if any VIP tier items were won and handle inventory
          for (const bundle of bundles) {
            if (bundle.ticket?.tierLevel === 'VIP_ITEM' && bundle.ticket?.tierPriority === 1) {
              const isTicketLevel = bundle.ticket.level !== undefined;
              await decrementVipInventory(bundle.ticket.id, isTicketLevel);
            }
          }

          return {
            success: true,
            spinResultId: updatedSpinResult.id,
            quantity,
            bundles,
            totalValue,
            totalPrice
          };
        });

        // Regenerate a pool in the background to replace the claimed one
        regenerateSinglePool(gameId, quantity).catch(error => {
          console.error('Error regenerating pool:', error);
        });

        console.log(`Successfully processed payment for spin ${pendingSpinResult.id}`);
      } catch (error: any) {
        console.error('Error processing checkout.session.completed:', error);
        return NextResponse.json(
          { error: 'Failed to process payment completion', message: error.message },
          { status: 500 }
        );
      }
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;

      try {
        // Mark the pending spin result as expired
        const expiredResult = await prisma.spinResult.findFirst({
          where: {
            stripeSessionId: session.id,
            paymentStatus: 'PENDING'
          },
          include: {
            user: true,
            game: true
          }
        });

        if (expiredResult) {
          // Update status
          await prisma.spinResult.update({
            where: { id: expiredResult.id },
            data: {
              paymentStatus: 'EXPIRED'
            }
          });

          // Send abandoned cart email
          if (session.customer_email || expiredResult.user.email) {
            const emailHtml = await render(AbandonedCartEmail({
              userName: expiredResult.user.name || expiredResult.user.email.split('@')[0],
              eventName: expiredResult.game.eventName,
              eventDate: expiredResult.game.eventDate,
              venue: expiredResult.game.venue,
              city: expiredResult.game.city,
              state: expiredResult.game.state,
              gameId: expiredResult.gameId,
              bundleQuantity: expiredResult.quantity,
              attemptedPrice: expiredResult.totalPrice,
              baseUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL
            }) as any) as string;

            await mailgunService.sendTemplatedEmail(
              session.customer_email || expiredResult.user.email,
              `Still interested in ${expiredResult.game.eventName}?`,
              emailHtml,
              undefined,
              { tags: ['abandoned-cart', 'recovery'] }
            );

            console.log(`Sent abandoned cart email for session ${session.id}`);
          }
        }
      } catch (error) {
        console.error('Error processing expired session:', error);
      }

      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      try {
        // Find the spin result associated with this payment
        const failedResult = await prisma.spinResult.findFirst({
          where: {
            stripePaymentIntentId: paymentIntent.id,
            paymentStatus: 'PENDING'
          },
          include: {
            user: true,
            game: true
          }
        });

        if (failedResult) {
          // Update status
          await prisma.spinResult.update({
            where: { id: failedResult.id },
            data: {
              paymentStatus: 'FAILED'
            }
          });

          // Send payment failed email
          const failureMessage = paymentIntent.last_payment_error?.message || 'Your payment could not be processed';

          const emailHtml = await render(PaymentFailedEmail({
            userName: failedResult.user.name || failedResult.user.email.split('@')[0],
            eventName: failedResult.game.eventName,
            eventDate: failedResult.game.eventDate,
            venue: failedResult.game.venue,
            city: failedResult.game.city,
            state: failedResult.game.state,
            attemptedAmount: failedResult.totalPrice,
            failureReason: failureMessage,
            gameId: failedResult.gameId,
            baseUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL
          }) as any) as string;

          await mailgunService.sendTemplatedEmail(
            failedResult.user.email,
            `Payment Failed - ${failedResult.game.eventName}`,
            emailHtml,
            undefined,
            { tags: ['payment-failed', 'retry'] }
          );

          console.log(`Sent payment failed email for payment intent ${paymentIntent.id}`);
        }
      } catch (error) {
        console.error('Error processing failed payment:', error);
      }

      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}