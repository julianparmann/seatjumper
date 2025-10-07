/**
 * Mercury Integration Service
 * Handles inventory filtering, locking, and purchasing for SeatJumper's spin-to-win model
 */

import { mercuryAPI } from '@/lib/api/mercury';
import { MercuryTicket, MercuryEvent } from '@/lib/api/mercury';
import { getStandardMemorabiliaForSport, VIP_WIN_CONFIG } from '@/lib/config/standard-memorabilia';
import { getSportFromMercuryEvent } from '@/lib/utils/sport-mapper';

export type PackType = 'blue' | 'red' | 'gold';

export interface PackFilter {
  type: PackType;
  excludedSections?: string[];
  includedSections?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
}

export interface FilteredInventory {
  tickets: MercuryTicket[];
  totalCount: number;
  avgPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  sections: string[];
}

export interface PriceCalculation {
  jumpPrice: number;
  baseTicketValue: number;
  memorabiliaValue: number;
  vipExpectedValue: number;
  margin: number;
  bundleSize: number;
}

export interface ProbabilityBreakdown {
  sections: Array<{
    name: string;
    probability: number;
    avgPrice: number;
    count: number;
  }>;
  vipProbability: number;
}

class MercuryIntegrationService {
  private static instance: MercuryIntegrationService;
  private readonly MARGIN_MULTIPLIER: number;

  private constructor() {
    // Get margin from environment or use default 30%
    const envMargin = process.env.JUMP_MARGIN_PERCENT;
    this.MARGIN_MULTIPLIER = envMargin
      ? 1 + (parseFloat(envMargin) / 100)
      : 1.3; // Default 30% margin

    console.log(`[Mercury Integration] Using ${((this.MARGIN_MULTIPLIER - 1) * 100).toFixed(0)}% margin`);
  }

  public static getInstance(): MercuryIntegrationService {
    if (!MercuryIntegrationService.instance) {
      MercuryIntegrationService.instance = new MercuryIntegrationService();
    }
    return MercuryIntegrationService.instance;
  }

  /**
   * Get pack-specific filters
   */
  private getPackFilters(packType: PackType, customExclusions: string[] = []): PackFilter {
    const baseFilters: Record<PackType, PackFilter> = {
      blue: {
        type: 'blue',
        // No exclusions - all seats available
      },
      red: {
        type: 'red',
        excludedSections: ['upper_deck', 'upper_level', 'balcony', 'terrace', ...customExclusions],
      },
      gold: {
        type: 'gold',
        includedSections: ['lower_bowl', 'field_level', 'club_level', 'loge', 'suite', 'premium'],
        excludedSections: customExclusions,
      },
    };

    return baseFilters[packType];
  }

  /**
   * Apply filters to ticket inventory
   */
  private applyFilters(tickets: MercuryTicket[], filter: PackFilter): MercuryTicket[] {
    let filtered = [...tickets];

    // Apply section inclusions (for gold pack)
    if (filter.includedSections && filter.includedSections.length > 0) {
      filtered = filtered.filter(ticket => {
        const sectionLower = ticket.section.toLowerCase();
        return filter.includedSections!.some(inc =>
          sectionLower.includes(inc.toLowerCase())
        );
      });
    }

    // Apply section exclusions
    if (filter.excludedSections && filter.excludedSections.length > 0) {
      filtered = filtered.filter(ticket => {
        const sectionLower = ticket.section.toLowerCase();
        return !filter.excludedSections!.some(exc =>
          sectionLower.includes(exc.toLowerCase())
        );
      });
    }

    // Apply price range filter if specified
    if (filter.priceRange) {
      if (filter.priceRange.min) {
        filtered = filtered.filter(ticket => ticket.price >= filter.priceRange!.min!);
      }
      if (filter.priceRange.max) {
        filtered = filtered.filter(ticket => ticket.price <= filter.priceRange!.max!);
      }
    }

    return filtered;
  }

  /**
   * Get filtered inventory for an event based on pack selection
   */
  async getFilteredInventory(
    eventId: string,
    packType: PackType,
    customExclusions: string[] = []
  ): Promise<FilteredInventory> {
    // Get all available tickets from Mercury
    const allTickets = await mercuryAPI.getInventory({ eventId });

    // Apply pack filters
    const filter = this.getPackFilters(packType, customExclusions);
    const filteredTickets = this.applyFilters(allTickets, filter);

    // Calculate statistics
    const prices = filteredTickets.map(t => t.price);
    const avgPrice = prices.length > 0
      ? prices.reduce((sum, p) => sum + p, 0) / prices.length
      : 0;

    const sections = [...new Set(filteredTickets.map(t => t.section))];

    return {
      tickets: filteredTickets,
      totalCount: filteredTickets.length,
      avgPrice,
      priceRange: {
        min: Math.min(...prices, 0),
        max: Math.max(...prices, 0),
      },
      sections,
    };
  }

  /**
   * Calculate jump price based on filtered inventory
   */
  async calculateJumpPrice(
    eventId: string,
    packType: PackType,
    bundleSize: number,
    customExclusions: string[] = [],
    memorabiliaValue?: number // Optional override
  ): Promise<PriceCalculation> {
    // Get filtered inventory
    const inventory = await this.getFilteredInventory(eventId, packType, customExclusions);

    // Get event details to determine sport/category
    const event = await this.getEventDetails(eventId);

    // Map Mercury event to sport type
    const sport = getSportFromMercuryEvent(event);

    // Get standard memorabilia value based on sport if not provided
    const actualMemorabiliaValue = memorabiliaValue ??
      getStandardMemorabiliaForSport(sport).value;

    // Base ticket value is average of filtered tickets
    const baseTicketValue = inventory.avgPrice;

    // Get VIP ticket value for expected value calculation
    const vipTickets = await this.getVIPTickets(eventId);
    const vipValue = vipTickets.length > 0
      ? vipTickets.reduce((sum, t) => sum + t.price, 0) / vipTickets.length
      : baseTicketValue * VIP_WIN_CONFIG.multiplier;

    // Calculate VIP expected value
    const vipExpectedValue = VIP_WIN_CONFIG.probability * vipValue;

    // Calculate total price
    const basePrice = (baseTicketValue + actualMemorabiliaValue) * bundleSize;
    const withVIP = basePrice + (vipExpectedValue * bundleSize);
    const jumpPrice = withVIP * this.MARGIN_MULTIPLIER;

    return {
      jumpPrice: Math.round(jumpPrice * 100) / 100, // Round to cents
      baseTicketValue,
      memorabiliaValue: actualMemorabiliaValue,
      vipExpectedValue,
      margin: this.MARGIN_MULTIPLIER,
      bundleSize,
    };
  }

  /**
   * Get VIP tickets for an event (top 5% by price)
   */
  async getVIPTickets(eventId: string): Promise<MercuryTicket[]> {
    const allTickets = await mercuryAPI.getInventory({ eventId });

    // Sort by price descending
    const sorted = allTickets.sort((a, b) => b.price - a.price);

    // Take top 5%
    const vipCount = Math.max(1, Math.floor(sorted.length * 0.05));
    return sorted.slice(0, vipCount);
  }

  /**
   * Calculate probability breakdown for display
   */
  async calculateProbabilities(
    eventId: string,
    packType: PackType,
    customExclusions: string[] = []
  ): Promise<ProbabilityBreakdown> {
    const inventory = await this.getFilteredInventory(eventId, packType, customExclusions);

    // Group tickets by section
    const sectionGroups = inventory.tickets.reduce((acc, ticket) => {
      if (!acc[ticket.section]) {
        acc[ticket.section] = {
          tickets: [],
          totalPrice: 0,
        };
      }
      acc[ticket.section].tickets.push(ticket);
      acc[ticket.section].totalPrice += ticket.price;
      return acc;
    }, {} as Record<string, { tickets: MercuryTicket[], totalPrice: number }>);

    // Calculate probabilities
    const totalTickets = inventory.totalCount;
    const sections = Object.entries(sectionGroups).map(([name, group]) => ({
      name,
      probability: (group.tickets.length / totalTickets) * (1 - VIP_WIN_CONFIG.probability),
      avgPrice: group.totalPrice / group.tickets.length,
      count: group.tickets.length,
    }));

    // Sort by probability descending
    sections.sort((a, b) => b.probability - a.probability);

    return {
      sections,
      vipProbability: VIP_WIN_CONFIG.probability,
    };
  }

  /**
   * Lock winning tickets after spin
   */
  async lockWinningTickets(
    ticketGroupId: string,
    quantity: number,
    wholesalePrice: number
  ) {
    const lockId = this.generateLockId();

    try {
      const lockResponse = await mercuryAPI.createHold(
        ticketGroupId,
        quantity,
        wholesalePrice,
        lockId
      );

      console.log(`[Mercury Lock] Successfully locked tickets: ${lockId}`);
      return lockResponse;
    } catch (error) {
      console.error(`[Mercury Lock] Failed to lock tickets:`, error);
      throw new Error('Failed to lock winning tickets');
    }
  }

  /**
   * Purchase locked tickets with business account
   */
  async purchaseWithBusinessAccount(lockId: string) {
    const businessPayment = {
      accountId: process.env.MERCURY_BUSINESS_ACCOUNT_ID,
      paymentMethod: process.env.MERCURY_PAYMENT_METHOD,
      // Add any additional payment info required by Mercury
    };

    if (!businessPayment.accountId || !businessPayment.paymentMethod) {
      throw new Error('Business payment configuration missing');
    }

    try {
      const orderResponse = await mercuryAPI.purchaseTickets(lockId, businessPayment);
      console.log(`[Mercury Purchase] Successfully purchased: ${orderResponse.orderId}`);
      return orderResponse;
    } catch (error) {
      console.error(`[Mercury Purchase] Failed to purchase:`, error);
      throw new Error('Failed to complete ticket purchase');
    }
  }

  /**
   * Get delivery information for completed order
   */
  async getDeliveryInfo(orderId: string) {
    try {
      const delivery = await mercuryAPI.getTicketDelivery(orderId);
      console.log(`[Mercury Delivery] Retrieved delivery info for: ${orderId}`);
      return delivery;
    } catch (error) {
      console.error(`[Mercury Delivery] Failed to get delivery info:`, error);
      throw new Error('Failed to retrieve ticket delivery information');
    }
  }

  /**
   * Release a lock if purchase fails
   */
  async releaseLock(holdId: string) {
    try {
      await mercuryAPI.releaseHold(holdId);
      console.log(`[Mercury Lock] Released lock: ${holdId}`);
    } catch (error) {
      console.error(`[Mercury Lock] Failed to release lock:`, error);
      // Non-critical error, lock will expire automatically
    }
  }

  /**
   * Generate unique lock ID
   */
  private generateLockId(): string {
    return `sj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Search events from Mercury Catalog
   */
  async searchEvents(query: string, filters?: {
    sport?: string;
    dateFrom?: Date;
    dateTo?: Date;
    venue?: string;
  }) {
    try {
      // Build search query
      let searchQuery = query;

      if (filters?.sport) {
        searchQuery += ` ${filters.sport}`;
      }

      const events = await mercuryAPI.searchEvents(searchQuery);

      // Apply additional filters if needed
      let filtered = events;

      if (filters?.dateFrom) {
        filtered = filtered.filter(e => new Date(e.date) >= filters.dateFrom!);
      }

      if (filters?.dateTo) {
        filtered = filtered.filter(e => new Date(e.date) <= filters.dateTo!);
      }

      if (filters?.venue) {
        filtered = filtered.filter(e =>
          e.venue.name.toLowerCase().includes(filters.venue!.toLowerCase())
        );
      }

      return filtered;
    } catch (error) {
      console.error('[Mercury Search] Failed to search events:', error);
      // Return empty array instead of throwing to prevent .map() errors
      return [];
    }
  }

  /**
   * Get event details
   */
  async getEventDetails(eventId: string) {
    try {
      const event = await mercuryAPI.getEvent(eventId);
      return event;
    } catch (error) {
      console.error(`[Mercury Event] Failed to get event ${eventId}:`, error);
      throw new Error('Failed to retrieve event details');
    }
  }
}

// Export singleton instance
export const mercuryIntegrationService = MercuryIntegrationService.getInstance();