import { NextRequest, NextResponse } from 'next/server';
import { webhookAPI } from '@/lib/api/webhook';
import { prisma } from '@/lib/db';
import { processTicketDelivery } from '@/lib/services/mercury-jump-service';

/**
 * Webhook endpoint to receive Mercury order updates
 * This handles real-time notifications about order status, delivery, etc.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Mercury Webhook] Received webhook notification');

    // Get raw body for signature verification
    const rawBody = await request.text();
    console.log('[Mercury Webhook] Raw body:', rawBody);

    // Verify signature if provided (optional in sandbox)
    const signature = request.headers.get('X-Webhook-Signature');
    if (signature && process.env.WEBHOOK_SECRET) {
      const isValid = webhookAPI.verifySignature(rawBody, signature);
      if (!isValid) {
        console.error('[Mercury Webhook] Invalid signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse the notification
    let notification;
    try {
      notification = JSON.parse(rawBody);
    } catch (err) {
      console.error('[Mercury Webhook] Failed to parse JSON:', err);
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    // Process the webhook
    const processed = webhookAPI.processWebhook(notification);
    console.log('[Mercury Webhook] Processed notification:', processed);

    // Handle different webhook types
    if (processed.mercuryTransactionId) {
      await handleMercuryUpdate(
        processed.mercuryTransactionId,
        processed.type,
        processed.data
      );
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('[Mercury Webhook] Error processing webhook:', error);

    // Log to database for debugging
    try {
      await prisma.webhookLog.create({
        data: {
          source: 'mercury',
          event: 'error',
          payload: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }),
          processedAt: new Date()
        }
      });
    } catch (logError) {
      console.error('[Mercury Webhook] Failed to log error:', logError);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle Mercury order updates
 */
async function handleMercuryUpdate(
  mercuryTransactionId: string,
  eventType: string,
  data: any
) {
  console.log(`[Mercury Webhook] Handling ${eventType} for transaction ${mercuryTransactionId}`);

  try {
    // Log the webhook event
    await prisma.webhookLog.create({
      data: {
        source: 'mercury',
        event: eventType,
        payload: JSON.stringify({
          mercuryTransactionId,
          data,
          timestamp: new Date().toISOString()
        }),
        processedAt: new Date()
      }
    });

    // Find the jump purchase by Mercury order ID
    const jumpPurchase = await prisma.jumpPurchase.findFirst({
      where: {
        mercuryOrderId: mercuryTransactionId
      }
    });

    if (!jumpPurchase) {
      console.warn(`[Mercury Webhook] No jump purchase found for Mercury order ${mercuryTransactionId}`);
      return;
    }

    // Update based on event type
    switch (eventType.toLowerCase()) {
      case 'order.confirmed':
      case 'order.completed':
        await handleOrderCompleted(jumpPurchase.id, mercuryTransactionId);
        break;

      case 'order.failed':
      case 'order.cancelled':
        await handleOrderFailed(jumpPurchase.id, data?.reason || 'Order failed');
        break;

      case 'delivery.available':
      case 'tickets.ready':
        await handleTicketsReady(jumpPurchase.id, mercuryTransactionId, jumpPurchase.userId);
        break;

      case 'delivery.updated':
        await handleDeliveryUpdate(jumpPurchase.id, data);
        break;

      default:
        console.log(`[Mercury Webhook] Unhandled event type: ${eventType}`);
    }

  } catch (error) {
    console.error(`[Mercury Webhook] Error handling update:`, error);
    throw error;
  }
}

/**
 * Handle successful order completion
 */
async function handleOrderCompleted(jumpPurchaseId: string, mercuryOrderId: string) {
  console.log(`[Mercury Webhook] Order completed: ${mercuryOrderId}`);

  await prisma.jumpPurchase.update({
    where: { id: jumpPurchaseId },
    data: {
      status: 'completed',
      completedAt: new Date()
    }
  });

  // TODO: Send confirmation email to customer
}

/**
 * Handle failed order
 */
async function handleOrderFailed(jumpPurchaseId: string, reason: string) {
  console.log(`[Mercury Webhook] Order failed: ${reason}`);

  await prisma.jumpPurchase.update({
    where: { id: jumpPurchaseId },
    data: {
      status: 'failed',
      error: reason,
      completedAt: new Date()
    }
  });

  // TODO: Send failure notification to customer
  // TODO: Process refund if needed
}

/**
 * Handle tickets becoming available
 */
async function handleTicketsReady(
  jumpPurchaseId: string,
  mercuryOrderId: string,
  userId: string
) {
  console.log(`[Mercury Webhook] Tickets ready for order: ${mercuryOrderId}`);

  try {
    // Fetch and store ticket delivery
    const delivery = await processTicketDelivery(
      mercuryOrderId,
      userId,
      jumpPurchaseId
    );

    if (delivery.available) {
      console.log(`[Mercury Webhook] Tickets delivered successfully`);

      // Update status
      await prisma.jumpPurchase.update({
        where: { id: jumpPurchaseId },
        data: {
          ticketDeliveryStatus: 'delivered',
          completedAt: new Date()
        }
      });

      // TODO: Send tickets to customer via email
    }
  } catch (error) {
    console.error(`[Mercury Webhook] Failed to process ticket delivery:`, error);

    await prisma.jumpPurchase.update({
      where: { id: jumpPurchaseId },
      data: {
        ticketDeliveryStatus: 'failed',
        error: 'Failed to retrieve tickets'
      }
    });
  }
}

/**
 * Handle delivery updates
 */
async function handleDeliveryUpdate(jumpPurchaseId: string, deliveryData: any) {
  console.log(`[Mercury Webhook] Delivery update received`);

  await prisma.jumpPurchase.update({
    where: { id: jumpPurchaseId },
    data: {
      ticketDeliveryData: JSON.stringify(deliveryData),
      ticketDeliveryStatus: 'delivered'
    }
  });
}