/**
 * Mercury Jump Service
 * Handles ticket randomization, locking, and purchasing via Mercury API
 */

import { mercuryAPI } from '@/lib/api/mercury';
import { ticketVaultAPI } from '@/lib/api/ticketvault';
import { selectRandomFromPool, type MercuryTicketGroup } from '@/lib/utils/jump-calculator';
import { prisma } from '@/lib/db';

export interface JumpPurchaseResult {
  success: boolean;
  mercuryOrderId?: string;
  mercuryLockId?: string;
  ticketGroupId?: string;
  section?: string;
  row?: string;
  seats?: string[];
  quantity?: number;
  wholesalePrice?: number;
  error?: string;
  requiresManualFulfillment?: boolean;
}

/**
 * Execute the complete jump purchase flow after payment
 * 1. Get filtered inventory based on user's sections
 * 2. Randomly select tickets
 * 3. Lock tickets with Mercury
 * 4. Purchase tickets immediately
 */
export async function executeJumpPurchase(
  eventId: string,
  userId: string,
  quantity: number,
  excludedSections: string[],
  stripeSessionId: string,
  selectedTicketIds: string[] = []
): Promise<JumpPurchaseResult> {
  console.log(`[Mercury Jump] ===== Starting Jump Purchase =====`);
  console.log(`[Mercury Jump] Event ID: ${eventId}`);
  console.log(`[Mercury Jump] User ID: ${userId}`);
  console.log(`[Mercury Jump] Quantity: ${quantity}`);
  console.log(`[Mercury Jump] Excluded Sections: ${excludedSections.join(', ') || 'None'}`);
  console.log(`[Mercury Jump] Selected Ticket IDs: ${selectedTicketIds.join(', ') || 'None (will randomize)'}`);
  console.log(`[Mercury Jump] Stripe Session: ${stripeSessionId}`);

  try {
    // Step 1: Get current inventory from Mercury
    console.log(`[Mercury Jump] Step 1: Fetching inventory from Mercury...`);
    const inventory = await mercuryAPI.getInventory({ eventId });

    if (!inventory || inventory.length === 0) {
      console.error(`[Mercury Jump] No inventory available for event ${eventId}`);
      return {
        success: false,
        error: 'No inventory available',
        requiresManualFulfillment: true
      };
    }

    console.log(`[Mercury Jump] Found ${inventory.length} ticket groups in inventory`);

    // Step 2: Transform and filter inventory
    console.log(`[Mercury Jump] Step 2: Transforming and filtering inventory...`);
    const ticketGroups: MercuryTicketGroup[] = inventory.map(ticket => ({
      exchangeTicketGroupId: parseInt(ticket.id) || 0,
      section: ticket.section || 'General',
      row: ticket.row || '',
      availableQuantity: ticket.quantity || 0,
      purchasableQuantities: ticket.splits || [ticket.quantity],
      unitPrice: {
        wholesalePrice: {
          value: ticket.price || 0,
          currencyCode: 'USD'
        }
      },
      standardSection: ticket.section,
      canonicalSection: ticket.section
    }));

    // Filter to only selected ticket IDs if provided, otherwise filter by excluded sections
    let availableGroups = ticketGroups;
    if (selectedTicketIds.length > 0) {
      // User has specifically selected ticket IDs
      availableGroups = ticketGroups.filter(g =>
        selectedTicketIds.includes(g.exchangeTicketGroupId.toString())
      );
    } else if (excludedSections.length > 0) {
      // Fall back to section-based filtering
      availableGroups = ticketGroups.filter(g =>
        !excludedSections.includes(g.standardSection || g.section)
      );
    }

    console.log(`[Mercury Jump] Filtered to ${availableGroups.length} groups after applying filters`);

    // Step 3: Randomly select a ticket group from the filtered pool
    console.log(`[Mercury Jump] Step 3: Randomly selecting ticket from pool...`);
    const selectedGroup = selectRandomFromPool(availableGroups, quantity);

    if (!selectedGroup) {
      console.error(`[Mercury Jump] No valid ticket groups for quantity ${quantity}`);
      return {
        success: false,
        error: `No tickets available for quantity ${quantity}`,
        requiresManualFulfillment: true
      };
    }

    console.log(`[Mercury Jump] ✓ Selected ticket group:`);
    console.log(`[Mercury Jump]   - Group ID: ${selectedGroup.exchangeTicketGroupId}`);
    console.log(`[Mercury Jump]   - Section: ${selectedGroup.section}`);
    console.log(`[Mercury Jump]   - Row: ${selectedGroup.row}`);
    console.log(`[Mercury Jump]   - Price per ticket: $${selectedGroup.unitPrice.wholesalePrice.value}`);

    // Step 4: Check if we have sufficient credit before attempting purchase
    const wholesalePrice = selectedGroup.unitPrice.wholesalePrice.value;
    const totalCost = wholesalePrice * quantity;

    console.log(`[Mercury Jump] Step 4: Checking credit availability...`);
    console.log(`[Mercury Jump] Total cost: $${totalCost.toFixed(2)} (${quantity} x $${wholesalePrice})`);

    const creditCheck = await mercuryAPI.checkSufficientCredit(totalCost);

    if (!creditCheck.sufficient) {
      console.error(`[Mercury Jump] ✗ INSUFFICIENT CREDIT`);
      console.error(`[Mercury Jump]   Required: $${totalCost.toFixed(2)}`);
      console.error(`[Mercury Jump]   Available: $${creditCheck.availableCredit.toFixed(2)}`);
      console.error(`[Mercury Jump]   Message: ${creditCheck.message}`);
      throw new Error(creditCheck.message || 'Insufficient Mercury credit for this purchase');
    }

    console.log(`[Mercury Jump] ✓ Credit check passed`);
    console.log(`[Mercury Jump]   Available credit: $${creditCheck.availableCredit.toFixed(2)}`);
    console.log(`[Mercury Jump]   Purchase amount: $${totalCost.toFixed(2)}`);

    // Step 5: Create hold/lock with Mercury
    console.log(`[Mercury Jump] Step 5: Creating ticket hold/lock...`);
    const hold = await mercuryAPI.createHold(
      selectedGroup.exchangeTicketGroupId.toString(),
      quantity,
      wholesalePrice
    );

    console.log(`[Mercury Jump] ✓ Created hold`);
    console.log(`[Mercury Jump]   Hold ID: ${hold.holdId}`);
    console.log(`[Mercury Jump]   Quantity: ${quantity} tickets`);
    console.log(`[Mercury Jump]   Price per ticket: $${wholesalePrice}`);

    // Step 6: Immediately purchase the tickets
    console.log(`[Mercury Jump] Step 6: Converting hold to purchase...`);
    try {
      const order = await mercuryAPI.purchaseTickets(hold.holdId);

      console.log(`[Mercury Jump] ✓✓✓ PURCHASE SUCCESSFUL ✓✓✓`);
      console.log(`[Mercury Jump] Mercury Order ID: ${order.orderId}`);
      console.log(`[Mercury Jump] Purchase Price: $${order.purchasePrice}`);

      // Step 6: Store order details in database
      // This will be handled in the webhook now, not here
      console.log(`[Mercury Jump] Order details will be stored via webhook`);

      return {
        success: true,
        mercuryOrderId: order.orderId,
        mercuryLockId: hold.holdId,
        ticketGroupId: selectedGroup.exchangeTicketGroupId.toString(),
        section: selectedGroup.section,
        row: selectedGroup.row,
        quantity: quantity,
        wholesalePrice: wholesalePrice * quantity
      };

    } catch (purchaseError) {
      console.error(`[Mercury Jump] Purchase failed, releasing hold ${hold.holdId}:`, purchaseError);

      // Try to release the hold
      try {
        await mercuryAPI.releaseHold(hold.holdId);
        console.log(`[Mercury Jump] Released hold ${hold.holdId}`);
      } catch (releaseError) {
        console.error(`[Mercury Jump] Failed to release hold:`, releaseError);
      }

      throw purchaseError;
    }

  } catch (error) {
    console.error(`[Mercury Jump] Error in purchase flow:`, error);

    // Log failed attempt for manual intervention
    await logFailedPurchase(eventId, userId, quantity, stripeSessionId, error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Purchase failed',
      requiresManualFulfillment: true
    };
  }
}

/**
 * Log failed purchase attempts for manual intervention
 */
async function logFailedPurchase(
  eventId: string,
  userId: string,
  quantity: number,
  stripeSessionId: string,
  error: any
) {
  try {
    // This is now handled in the webhook with the JumpPurchase model
    console.log('[Mercury Jump] Failed purchase will be logged via webhook');
  } catch (logError) {
    console.error('[Mercury Jump] Failed to log error:', logError);
  }
}

/**
 * Check Mercury order status (for webhook/monitoring)
 */
export async function checkOrderStatus(mercuryOrderId: string) {
  try {
    const order = await mercuryAPI.getOrder(mercuryOrderId);
    return order;
  } catch (error) {
    console.error(`[Mercury Jump] Failed to check order status:`, error);
    throw error;
  }
}

/**
 * Get ticket delivery information (barcodes, PDFs, transfer URLs)
 * Automatically tries all available delivery methods
 */
export async function getTicketDelivery(mercuryOrderId: string) {
  try {
    console.log(`[Mercury Jump] Fetching ticket delivery for order ${mercuryOrderId}`);

    // Wait a short time for tickets to be processed in TicketVault
    // Some tickets may take a moment to become available
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch all available delivery methods
    const deliveryMethods = await ticketVaultAPI.getAllDeliveryMethods(mercuryOrderId);

    if (deliveryMethods.availableMethods.length === 0) {
      console.warn(`[Mercury Jump] No delivery methods available yet for order ${mercuryOrderId}`);
      // This is not necessarily an error - tickets might still be processing
      return {
        available: false,
        message: 'Tickets are being processed. They will be delivered via email shortly.'
      };
    }

    console.log(`[Mercury Jump] Found ${deliveryMethods.availableMethods.length} delivery methods`);

    return {
      available: true,
      ...deliveryMethods
    };
  } catch (error) {
    console.error(`[Mercury Jump] Failed to get ticket delivery:`, error);
    // Don't throw - tickets might be delivered later via webhook
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tickets',
      message: 'Tickets will be delivered via email once available.'
    };
  }
}

/**
 * Process and store ticket delivery after successful purchase
 * Called after Mercury order is confirmed
 */
export async function processTicketDelivery(
  mercuryOrderId: string,
  userId: string,
  stripeSessionId: string
) {
  try {
    console.log(`[Mercury Jump] Processing ticket delivery for order ${mercuryOrderId}`);

    const delivery = await getTicketDelivery(mercuryOrderId);

    if (!delivery.available) {
      console.log(`[Mercury Jump] Tickets not yet available, will retry via webhook`);
      return delivery;
    }

    // Update the jump purchase record with delivery info
    await prisma.jumpPurchase.updateMany({
      where: {
        mercuryOrderId,
        userId
      },
      data: {
        ticketDeliveryStatus: 'delivered',
        ticketDeliveryData: JSON.stringify(delivery),
        completedAt: new Date()
      }
    });

    // TODO: Send tickets via email
    // This would integrate with your email service
    // For now, tickets are stored in the database

    console.log(`[Mercury Jump] Ticket delivery processed and stored`);
    return delivery;

  } catch (error) {
    console.error(`[Mercury Jump] Error processing ticket delivery:`, error);

    // Mark as pending delivery for retry
    await prisma.jumpPurchase.updateMany({
      where: {
        mercuryOrderId,
        userId
      },
      data: {
        ticketDeliveryStatus: 'pending'
      }
    });

    throw error;
  }
}