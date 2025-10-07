/**
 * VIP Prize Randomization Service
 * Handles the 1-in-5000 (0.0002) probability VIP prize system
 */

import { prisma } from '@/lib/db';
import { mercuryAPI } from '@/lib/api/mercury';
import { TierLevel } from '@prisma/client';

export interface VIPRollResult {
  ticketWon: boolean;
  memorabiliaWon: boolean;
  ticketRoll: number;
  memorabiliaRoll: number;
  expectedValue: number;
}

export interface VIPPrizePool {
  tickets: any[];
  memorabilia: any[];
  avgTicketValue: number;
  avgMemorabiliaValue: number;
  lastUpdated: Date;
}

export interface VIPPrizeWin {
  type: 'ticket' | 'memorabilia';
  item: any;
  rollValue: number;
  probability: number;
}

export class VIPRandomizationService {
  private static instance: VIPRandomizationService;
  private readonly VIP_PROBABILITY = 0.0002; // 1 in 5,000
  private vipPoolCache: Map<string, VIPPrizePool> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): VIPRandomizationService {
    if (!VIPRandomizationService.instance) {
      VIPRandomizationService.instance = new VIPRandomizationService();
    }
    return VIPRandomizationService.instance;
  }

  /**
   * Roll for VIP prizes (both ticket and memorabilia)
   */
  async rollForVIPPrizes(gameId: string, userId: string): Promise<VIPRollResult> {
    // Generate random values for both rolls
    const ticketRoll = Math.random();
    const memorabiliaRoll = Math.random();

    // Check if VIP prizes are won
    const ticketWon = ticketRoll < this.VIP_PROBABILITY;
    const memorabiliaWon = memorabiliaRoll < this.VIP_PROBABILITY;

    // Calculate expected value for pricing
    const vipPool = await this.getVIPPrizePool(gameId);
    const expectedValue = this.calculateExpectedValue(vipPool);

    // Log the roll for audit purposes
    console.log(`[VIP Roll] User ${userId} - Ticket: ${ticketRoll.toFixed(6)} (${ticketWon ? 'WIN' : 'LOSE'}), Memorabilia: ${memorabiliaRoll.toFixed(6)} (${memorabiliaWon ? 'WIN' : 'LOSE'})`);

    return {
      ticketWon,
      memorabiliaWon,
      ticketRoll,
      memorabiliaRoll,
      expectedValue
    };
  }

  /**
   * Get VIP prize pool for a game
   */
  async getVIPPrizePool(gameId: string): Promise<VIPPrizePool> {
    // Check cache first
    const cached = this.vipPoolCache.get(gameId);
    if (cached && this.isCacheValid(cached.lastUpdated)) {
      return cached;
    }

    // Fetch VIP prizes from database
    const game = await prisma.dailyGame.findUnique({
      where: { id: gameId },
      include: {
        ticketLevels: {
          where: {
            tierLevel: TierLevel.VIP_ITEM,
            tierPriority: 1, // Primary VIP items only
            quantity: { gt: 0 }
          }
        },
        ticketGroups: {
          where: {
            tierLevel: TierLevel.VIP_ITEM,
            tierPriority: 1,
            status: 'AVAILABLE'
          }
        },
        cardBreaks: {
          where: {
            tierLevel: TierLevel.VIP_ITEM,
            tierPriority: 1,
            status: 'AVAILABLE'
          }
        }
      }
    });

    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }

    // For Mercury integration, also fetch top-tier tickets dynamically
    let mercuryVIPTickets: any[] = [];
    if (process.env.MERCURY_SANDBOX_MODE === 'true') {
      try {
        // In production, this would fetch real Mercury inventory
        // For now, use the database VIP items
        console.log('[VIP Pool] Would fetch top 5% Mercury tickets here');
      } catch (error) {
        console.error('[VIP Pool] Failed to fetch Mercury VIP tickets:', error);
      }
    }

    // Combine VIP tickets from database and Mercury
    const vipTickets = [
      ...game.ticketLevels.map(level => ({
        id: level.id,
        type: 'level',
        name: level.levelName,
        value: level.pricePerSeat,
        details: level
      })),
      ...game.ticketGroups.map(group => ({
        id: group.id,
        type: 'group',
        name: `${group.section} Row ${group.row}`,
        value: group.pricePerSeat,
        details: group
      })),
      ...mercuryVIPTickets
    ];

    // VIP memorabilia
    const vipMemorabilia = game.cardBreaks.map(item => ({
      id: item.id,
      name: item.breakName,
      value: item.breakValue,
      details: item
    }));

    // Calculate average values
    const avgTicketValue = vipTickets.length > 0
      ? vipTickets.reduce((sum, t) => sum + t.value, 0) / vipTickets.length
      : 0;

    const avgMemorabiliaValue = vipMemorabilia.length > 0
      ? vipMemorabilia.reduce((sum, m) => sum + m.value, 0) / vipMemorabilia.length
      : 0;

    const pool: VIPPrizePool = {
      tickets: vipTickets,
      memorabilia: vipMemorabilia,
      avgTicketValue,
      avgMemorabiliaValue,
      lastUpdated: new Date()
    };

    // Cache the pool
    this.vipPoolCache.set(gameId, pool);

    return pool;
  }

  /**
   * Select a VIP prize from the pool (when won)
   */
  async selectVIPPrize(
    gameId: string,
    type: 'ticket' | 'memorabilia',
    rollValue: number
  ): Promise<VIPPrizeWin | null> {
    const pool = await this.getVIPPrizePool(gameId);
    const items = type === 'ticket' ? pool.tickets : pool.memorabilia;

    if (items.length === 0) {
      console.error(`[VIP Select] No VIP ${type} items available for game ${gameId}`);
      return null;
    }

    // Randomly select from the pool
    const selectedIndex = Math.floor(Math.random() * items.length);
    const selectedItem = items[selectedIndex];

    // Mark the item as won and activate backup if needed
    if (type === 'ticket') {
      await this.handleVIPTicketWin(selectedItem);
    } else {
      await this.handleVIPMemorabiliaWin(selectedItem);
    }

    return {
      type,
      item: selectedItem,
      rollValue,
      probability: this.VIP_PROBABILITY
    };
  }

  /**
   * Handle VIP ticket win - mark as won and activate backup
   */
  private async handleVIPTicketWin(vipTicket: any): Promise<void> {
    try {
      if (vipTicket.type === 'level') {
        // Mark ticket level as won
        await prisma.ticketLevel.update({
          where: { id: vipTicket.id },
          data: { quantity: 0 } // Mark as unavailable
        });

        // Activate backup VIP ticket (tierPriority: 2)
        await this.activateBackupVIPTicket(vipTicket.details.gameId);
      } else if (vipTicket.type === 'group') {
        // Mark ticket group as won
        await prisma.ticketGroup.update({
          where: { id: vipTicket.id },
          data: { status: 'SOLD' }
        });

        // Activate backup
        await this.activateBackupVIPTicket(vipTicket.details.gameId);
      }
    } catch (error) {
      console.error('[VIP Win] Failed to handle VIP ticket win:', error);
    }
  }

  /**
   * Handle VIP memorabilia win
   */
  private async handleVIPMemorabiliaWin(vipItem: any): Promise<void> {
    try {
      await prisma.cardBreak.update({
        where: { id: vipItem.id },
        data: { status: 'SOLD' }
      });

      // Activate backup VIP memorabilia
      await this.activateBackupVIPMemorabilia(vipItem.details.gameId);
    } catch (error) {
      console.error('[VIP Win] Failed to handle VIP memorabilia win:', error);
    }
  }

  /**
   * Activate backup VIP ticket (tierPriority: 2 becomes 1)
   */
  private async activateBackupVIPTicket(gameId: string): Promise<void> {
    // Find the next backup ticket
    const backup = await prisma.ticketLevel.findFirst({
      where: {
        gameId,
        tierLevel: TierLevel.VIP_ITEM,
        tierPriority: 2
      }
    });

    if (backup) {
      // Promote backup to primary
      await prisma.ticketLevel.update({
        where: { id: backup.id },
        data: { tierPriority: 1 }
      });

      console.log(`[VIP Backup] Activated backup VIP ticket: ${backup.id}`);
    } else {
      // Check ticket groups for backup
      const backupGroup = await prisma.ticketGroup.findFirst({
        where: {
          gameId,
          tierLevel: TierLevel.VIP_ITEM,
          tierPriority: 2
        }
      });

      if (backupGroup) {
        await prisma.ticketGroup.update({
          where: { id: backupGroup.id },
          data: { tierPriority: 1 }
        });

        console.log(`[VIP Backup] Activated backup VIP ticket group: ${backupGroup.id}`);
      }
    }
  }

  /**
   * Activate backup VIP memorabilia
   */
  private async activateBackupVIPMemorabilia(gameId: string): Promise<void> {
    const backup = await prisma.cardBreak.findFirst({
      where: {
        gameId,
        tierLevel: TierLevel.VIP_ITEM,
        tierPriority: 2
      }
    });

    if (backup) {
      await prisma.cardBreak.update({
        where: { id: backup.id },
        data: { tierPriority: 1 }
      });

      console.log(`[VIP Backup] Activated backup VIP memorabilia: ${backup.id}`);
    }
  }

  /**
   * Calculate expected value for pricing
   */
  calculateExpectedValue(pool: VIPPrizePool): number {
    const ticketEV = this.VIP_PROBABILITY * pool.avgTicketValue;
    const memorabiliaEV = this.VIP_PROBABILITY * pool.avgMemorabiliaValue;
    return ticketEV + memorabiliaEV;
  }

  /**
   * Get VIP pricing component for a bundle
   */
  async getVIPPricingComponent(gameId: string, marginMultiplier: number = 1.3): Promise<number> {
    const pool = await this.getVIPPrizePool(gameId);
    const expectedValue = this.calculateExpectedValue(pool);
    return expectedValue * marginMultiplier;
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(lastUpdated: Date): boolean {
    return Date.now() - lastUpdated.getTime() < this.CACHE_TTL_MS;
  }

  /**
   * Get VIP statistics for monitoring
   */
  async getVIPStatistics(gameId: string): Promise<any> {
    const pool = await this.getVIPPrizePool(gameId);

    // Get historical VIP wins
    const vipWins = await prisma.spinResult.count({
      where: {
        gameId,
        OR: [
          { vipTicketWon: true },
          { vipMemorabiliaWon: true }
        ]
      }
    });

    const totalSpins = await prisma.spinResult.count({
      where: { gameId }
    });

    const actualWinRate = totalSpins > 0 ? vipWins / totalSpins : 0;
    const expectedWinRate = this.VIP_PROBABILITY * 2; // For both ticket and memorabilia

    return {
      vipTicketsAvailable: pool.tickets.length,
      vipMemorabiliaAvailable: pool.memorabilia.length,
      avgTicketValue: pool.avgTicketValue,
      avgMemorabiliaValue: pool.avgMemorabiliaValue,
      totalVIPWins: vipWins,
      totalSpins,
      actualWinRate,
      expectedWinRate,
      probability: this.VIP_PROBABILITY
    };
  }

  /**
   * Clear cache for a game (useful after inventory updates)
   */
  clearCache(gameId: string): void {
    this.vipPoolCache.delete(gameId);
  }
}

// Export singleton instance
export const vipRandomizationService = VIPRandomizationService.getInstance();