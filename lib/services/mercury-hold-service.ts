/**
 * Mercury Hold Management Service
 * Manages ticket holds/reservations during the checkout process
 */

import { mercuryAPI, MercuryHold, MercuryTicket } from '@/lib/api/mercury';
import { prisma } from '@/lib/db';

export interface HoldCreationRequest {
  userId: string;
  sessionId: string;
  gameId: string;
  selectedPack: string;
  bundleQuantity: number;
  randomizationResult: {
    tickets: MercuryTicket[];
    memorabilia: any[];
    totalValue: number;
  };
}

export interface HoldStatus {
  holdId: string;
  isActive: boolean;
  expiresIn: number; // seconds
  canExtend: boolean;
}

export class MercuryHoldService {
  private static instance: MercuryHoldService;
  private activeHolds: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    // Start cleanup job for expired holds
    this.startCleanupJob();
  }

  public static getInstance(): MercuryHoldService {
    if (!MercuryHoldService.instance) {
      MercuryHoldService.instance = new MercuryHoldService();
    }
    return MercuryHoldService.instance;
  }

  /**
   * Create holds for randomized tickets
   */
  async createHoldsForBundle(request: HoldCreationRequest): Promise<string[]> {
    const { userId, sessionId, randomizationResult } = request;
    const holdIds: string[] = [];
    const holdDuration = parseInt(process.env.MERCURY_HOLD_DURATION_SECONDS || '30');

    try {
      // Create a hold for each ticket in the randomization
      for (const ticket of randomizationResult.tickets) {
        const hold = await mercuryAPI.createHold(
          ticket.id,
          ticket.quantity,
          ticket.price,
          `${sessionId}_${ticket.id}` // Unique lock request ID
        );

        holdIds.push(hold.holdId);

        // Store in database for tracking (would need Prisma model)
        // await prisma.mercuryHold.create({
        //   data: {
        //     holdId: hold.holdId,
        //     userId,
        //     sessionId,
        //     ticketId: ticket.id,
        //     expiresAt: hold.expiresAt,
        //     status: 'active',
        //     randomizationData: randomizationResult,
        //   }
        // });

        // Set up auto-extend timer
        this.setupAutoExtend(hold.holdId, userId, sessionId);
      }

      // Store the complete randomization in session/cache
      await this.storeRandomization(sessionId, {
        holdIds,
        ...randomizationResult,
      });

      return holdIds;
    } catch (error) {
      // If any hold fails, release all created holds
      await this.releaseHolds(holdIds);
      throw new Error(`Failed to create holds: ${error}`);
    }
  }

  /**
   * Extend holds during active checkout
   */
  async extendHolds(holdIds: string[]): Promise<void> {
    const extendSeconds = parseInt(process.env.MERCURY_HOLD_AUTO_EXTEND_INTERVAL || '10');

    for (const holdId of holdIds) {
      try {
        await mercuryAPI.extendHold(holdId, extendSeconds);

        // Update database
        // await prisma.mercuryHold.update({
        //   where: { holdId },
        //   data: {
        //     expiresAt: new Date(Date.now() + extendSeconds * 1000),
        //   }
        // });
      } catch (error) {
        console.error(`Failed to extend hold ${holdId}:`, error);
      }
    }
  }

  /**
   * Release holds (cleanup)
   */
  async releaseHolds(holdIds: string[]): Promise<void> {
    for (const holdId of holdIds) {
      try {
        await mercuryAPI.releaseHold(holdId);

        // Update database
        // await prisma.mercuryHold.update({
        //   where: { holdId },
        //   data: { status: 'released' }
        // });

        // Clear auto-extend timer
        this.clearAutoExtend(holdId);
      } catch (error) {
        console.error(`Failed to release hold ${holdId}:`, error);
      }
    }
  }

  /**
   * Convert holds to purchases after payment
   */
  async convertHoldsToPurchases(holdIds: string[], paymentInfo: any): Promise<any[]> {
    const orders = [];

    for (const holdId of holdIds) {
      try {
        const order = await mercuryAPI.purchaseTickets(holdId, paymentInfo);

        // Update database
        // await prisma.mercuryHold.update({
        //   where: { holdId },
        //   data: {
        //     status: 'converted',
        //     convertedAt: new Date(),
        //   }
        // });

        orders.push(order);

        // Clear auto-extend timer
        this.clearAutoExtend(holdId);
      } catch (error) {
        console.error(`Failed to convert hold ${holdId} to purchase:`, error);
        throw error;
      }
    }

    return orders;
  }

  /**
   * Get hold status
   */
  async getHoldStatus(holdId: string): Promise<HoldStatus> {
    // In production, fetch from database
    // const hold = await prisma.mercuryHold.findUnique({
    //   where: { holdId }
    // });

    // Mock response for now
    return {
      holdId,
      isActive: true,
      expiresIn: 25,
      canExtend: true,
    };
  }

  /**
   * Check if user has active holds (prevent double-booking)
   */
  async hasActiveHolds(userId: string, sessionId: string): Promise<boolean> {
    // In production, check database
    // const activeHolds = await prisma.mercuryHold.count({
    //   where: {
    //     userId,
    //     sessionId,
    //     status: 'active',
    //     expiresAt: { gt: new Date() }
    //   }
    // });
    // return activeHolds > 0;

    return false; // Mock response
  }

  /**
   * Clear expired holds for a user
   */
  async clearExpiredHolds(userId: string): Promise<void> {
    // In production, query and release expired holds
    // const expiredHolds = await prisma.mercuryHold.findMany({
    //   where: {
    //     userId,
    //     status: 'active',
    //     expiresAt: { lt: new Date() }
    //   }
    // });

    // for (const hold of expiredHolds) {
    //   await this.releaseHolds([hold.holdId]);
    // }
  }

  /**
   * Store randomization result in session/cache
   */
  private async storeRandomization(sessionId: string, data: any): Promise<void> {
    // In production, use Redis or session storage
    // For now, store in memory (not production-ready)
    const key = `randomization:${sessionId}`;

    // This would be Redis in production
    // await redis.setex(key, 300, JSON.stringify(data)); // 5 minute expiry

    // Mock implementation
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, JSON.stringify(data));
    }
  }

  /**
   * Retrieve randomization result
   */
  async getRandomization(sessionId: string): Promise<any> {
    const key = `randomization:${sessionId}`;

    // In production, use Redis
    // const data = await redis.get(key);
    // return data ? JSON.parse(data) : null;

    // Mock implementation
    if (typeof window !== 'undefined') {
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  /**
   * Set up auto-extend timer for a hold
   */
  private setupAutoExtend(holdId: string, userId: string, sessionId: string): void {
    const interval = parseInt(process.env.MERCURY_HOLD_AUTO_EXTEND_INTERVAL || '10') * 1000;

    const timer = setInterval(async () => {
      try {
        // Check if checkout is still active (would check session/database)
        const isActive = await this.isCheckoutActive(sessionId);

        if (isActive) {
          await this.extendHolds([holdId]);
        } else {
          this.clearAutoExtend(holdId);
        }
      } catch (error) {
        console.error(`Auto-extend failed for hold ${holdId}:`, error);
        this.clearAutoExtend(holdId);
      }
    }, interval);

    this.activeHolds.set(holdId, timer);
  }

  /**
   * Clear auto-extend timer
   */
  private clearAutoExtend(holdId: string): void {
    const timer = this.activeHolds.get(holdId);
    if (timer) {
      clearInterval(timer);
      this.activeHolds.delete(holdId);
    }
  }

  /**
   * Check if checkout session is still active
   */
  private async isCheckoutActive(sessionId: string): Promise<boolean> {
    // In production, check session expiry, user activity, etc.
    // For now, return true
    return true;
  }

  /**
   * Background job to cleanup expired holds
   */
  private startCleanupJob(): void {
    // Run every minute
    setInterval(async () => {
      try {
        // In production, query database for expired holds
        // const expiredHolds = await prisma.mercuryHold.findMany({
        //   where: {
        //     status: 'active',
        //     expiresAt: { lt: new Date() }
        //   }
        // });

        // for (const hold of expiredHolds) {
        //   await this.releaseHolds([hold.holdId]);
        // }

        console.log('Hold cleanup job completed');
      } catch (error) {
        console.error('Hold cleanup job failed:', error);
      }
    }, 60000); // Every minute
  }

  /**
   * Get hold statistics for monitoring
   */
  async getHoldStatistics(): Promise<any> {
    // In production, aggregate from database
    return {
      activeHolds: this.activeHolds.size,
      totalHoldsToday: 0,
      averageHoldDuration: 0,
      conversionRate: 0,
    };
  }
}

// Export singleton instance
export const holdService = MercuryHoldService.getInstance();