/**
 * Mercury Inventory Sync Service
 * Manages real-time inventory synchronization with Mercury API
 */

import { mercuryAPI, MercuryTicket } from '@/lib/api/mercury';
import { prisma } from '@/lib/db';
import { TierLevel } from '@prisma/client';

export interface InventorySnapshot {
  eventId: string;
  timestamp: Date;
  tickets: MercuryTicket[];
  totalCount: number;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  tierBreakdown: {
    vip: number;
    gold: number;
    silver: number;
    bronze: number;
    upper: number;
  };
}

export interface TierMapping {
  tierLevel: TierLevel;
  sections: string[];
  maxPrice?: number;
  minPrice?: number;
  keywords?: string[];
}

export class MercuryInventoryService {
  private static instance: MercuryInventoryService;
  private cache: Map<string, InventorySnapshot> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;

  // Define tier mappings for different venues/sports
  private tierMappings: TierMapping[] = [
    {
      tierLevel: TierLevel.VIP_ITEM,
      sections: ['floor', 'courtside', 'club', 'suite', 'vip'],
      keywords: ['vip', 'premium', 'club'],
      minPrice: 500,
    },
    {
      tierLevel: TierLevel.GOLD_LEVEL,
      sections: ['100', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110'],
      minPrice: 200,
      maxPrice: 500,
    },
    {
      tierLevel: TierLevel.UPPER_DECK,
      sections: ['200', '201', '202', '203', '204', '205', '206', '207', '208', '209', '210'],
      minPrice: 100,
      maxPrice: 200,
    },
    {
      tierLevel: TierLevel.UPPER_DECK,
      sections: ['300', '301', '302', '303', '304', '305', '306', '307', '308', '309', '310'],
      minPrice: 50,
      maxPrice: 100,
    },
    {
      tierLevel: TierLevel.UPPER_DECK,
      sections: ['400', '401', '402', '403', '404', '405', '406', '407', '408', '409', '410'],
      maxPrice: 50,
    },
  ];

  private constructor() {}

  public static getInstance(): MercuryInventoryService {
    if (!MercuryInventoryService.instance) {
      MercuryInventoryService.instance = new MercuryInventoryService();
    }
    return MercuryInventoryService.instance;
  }

  /**
   * Fetch and sync inventory for a game
   */
  async syncInventoryForGame(gameId: string): Promise<InventorySnapshot> {
    try {
      // Get game details from database
      const game = await prisma.dailyGame.findUnique({
        where: { id: gameId },
        include: { stadium: true },
      });

      if (!game) {
        throw new Error(`Game ${gameId} not found`);
      }

      // Search for Mercury event (would need mapping logic)
      const mercuryEvents = await mercuryAPI.searchEvents(game.eventName);

      if (!mercuryEvents || mercuryEvents.length === 0) {
        console.warn(`No Mercury events found for ${game.eventName}`);
        return this.getEmptySnapshot(gameId);
      }

      const mercuryEventId = mercuryEvents[0].id;

      // Fetch inventory from Mercury
      const inventory = await mercuryAPI.getInventory({
        eventId: mercuryEventId,
        minQuantity: 1,
        maxQuantity: 4, // Max bundle size
      });

      // Create snapshot
      const snapshot = this.createSnapshot(mercuryEventId, inventory);

      // Cache the snapshot
      this.cache.set(gameId, snapshot);

      // Store in database (would need Prisma model)
      // await prisma.mercuryInventorySnapshot.create({
      //   data: {
      //     gameId,
      //     mercuryEventId,
      //     snapshot: snapshot,
      //     createdAt: new Date(),
      //   }
      // });

      return snapshot;
    } catch (error) {
      console.error(`Failed to sync inventory for game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Get cached inventory or fetch if stale
   */
  async getInventory(gameId: string, maxAge: number = 300): Promise<InventorySnapshot> {
    const cached = this.cache.get(gameId);

    if (cached && this.isFresh(cached.timestamp, maxAge)) {
      return cached;
    }

    return this.syncInventoryForGame(gameId);
  }

  /**
   * Map Mercury tickets to our tier system
   */
  mapTicketToTier(ticket: MercuryTicket): TierLevel {
    const sectionLower = ticket.section.toLowerCase();

    for (const mapping of this.tierMappings) {
      // Check section match
      const sectionMatch = mapping.sections.some(s =>
        sectionLower.includes(s.toLowerCase())
      );

      // Check keywords
      const keywordMatch = mapping.keywords?.some(k =>
        sectionLower.includes(k) ||
        ticket.notes?.toLowerCase().includes(k)
      );

      // Check price range
      const priceMatch =
        (!mapping.minPrice || ticket.price >= mapping.minPrice) &&
        (!mapping.maxPrice || ticket.price <= mapping.maxPrice);

      if (sectionMatch || keywordMatch) {
        if (priceMatch) {
          return mapping.tierLevel;
        }
      }
    }

    // Default based on price alone
    if (ticket.price >= 500) return TierLevel.VIP_ITEM;
    if (ticket.price >= 200) return TierLevel.GOLD_LEVEL;
    return TierLevel.UPPER_DECK;
  }

  /**
   * Filter inventory for specific pack and quantity
   */
  filterInventoryForPack(
    inventory: MercuryTicket[],
    pack: 'blue' | 'red' | 'gold',
    quantity: number
  ): MercuryTicket[] {
    return inventory.filter(ticket => {
      // Check quantity availability
      if (ticket.quantity < quantity) return false;

      // Filter by pack rules
      const tier = this.mapTicketToTier(ticket);

      switch (pack) {
        case 'blue':
          // All seats available
          return true;
        case 'red':
          // No upper deck
          return tier !== TierLevel.UPPER_DECK;
        case 'gold':
          // Front row only (would need row data)
          return ticket.row && ['1', 'A', 'AA'].includes(ticket.row);
        default:
          return true;
      }
    });
  }

  /**
   * Calculate pricing with margins
   */
  calculateBundlePrice(
    tickets: MercuryTicket[],
    quantity: number,
    marginPercentage: number = 30
  ): number {
    if (tickets.length === 0) return 0;

    // Calculate average wholesale price
    const totalValue = tickets.reduce((sum, ticket) => sum + ticket.price, 0);
    const avgPrice = totalValue / tickets.length;

    // Apply quantity and margin
    const bundleWholesale = avgPrice * quantity;
    const marginMultiplier = 1 + (marginPercentage / 100);

    return Math.round(bundleWholesale * marginMultiplier);
  }

  /**
   * Start automatic sync for active games
   */
  startAutoSync(intervalSeconds: number = 300): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        // Get active games
        const activeGames = await prisma.dailyGame.findMany({
          where: {
            status: 'ACTIVE',
            eventDate: { gte: new Date() },
          },
        });

        // Sync each game
        for (const game of activeGames) {
          await this.syncInventoryForGame(game.id);
        }

        console.log(`Synced inventory for ${activeGames.length} active games`);
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }, intervalSeconds * 1000);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Create inventory snapshot
   */
  private createSnapshot(eventId: string, tickets: MercuryTicket[]): InventorySnapshot {
    const prices = tickets.map(t => t.price);

    const tierBreakdown = {
      vip: 0,
      gold: 0,
      silver: 0,
      bronze: 0,
      upper: 0,
    };

    // Count tickets by tier
    tickets.forEach(ticket => {
      const tier = this.mapTicketToTier(ticket);
      switch (tier) {
        case TierLevel.VIP_ITEM:
          tierBreakdown.vip += ticket.quantity;
          break;
        case TierLevel.GOLD_LEVEL:
          tierBreakdown.gold += ticket.quantity;
          break;
        case TierLevel.UPPER_DECK:
          tierBreakdown.silver += ticket.quantity;
          tierBreakdown.bronze += ticket.quantity;
          tierBreakdown.upper += ticket.quantity;
          break;
      }
    });

    return {
      eventId,
      timestamp: new Date(),
      tickets,
      totalCount: tickets.reduce((sum, t) => sum + t.quantity, 0),
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: prices.reduce((a, b) => a + b, 0) / prices.length,
      },
      tierBreakdown,
    };
  }

  /**
   * Get empty snapshot
   */
  private getEmptySnapshot(eventId: string): InventorySnapshot {
    return {
      eventId,
      timestamp: new Date(),
      tickets: [],
      totalCount: 0,
      priceRange: {
        min: 0,
        max: 0,
        average: 0,
      },
      tierBreakdown: {
        vip: 0,
        gold: 0,
        silver: 0,
        bronze: 0,
        upper: 0,
      },
    };
  }

  /**
   * Check if cached data is fresh
   */
  private isFresh(timestamp: Date, maxAgeSeconds: number): boolean {
    const age = (Date.now() - timestamp.getTime()) / 1000;
    return age < maxAgeSeconds;
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats(): Promise<any> {
    const stats = {
      cachedEvents: this.cache.size,
      syncActive: this.syncInterval !== null,
      snapshots: [] as any[],
    };

    this.cache.forEach((snapshot, gameId) => {
      stats.snapshots.push({
        gameId,
        timestamp: snapshot.timestamp,
        totalTickets: snapshot.totalCount,
        priceRange: snapshot.priceRange,
      });
    });

    return stats;
  }
}

// Export singleton instance
export const inventoryService = MercuryInventoryService.getInstance();