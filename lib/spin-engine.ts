import { TicketInventory, BreakDetails, SpinResult, RiskProfile } from '@/types';

export class SpinEngine {
  private random: () => number;

  constructor(seed?: number) {
    // Use seeded random for testing, or Math.random for production
    this.random = seed !== undefined ? this.seededRandom(seed) : Math.random;
  }

  private seededRandom(seed: number): () => number {
    return () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
  }

  performSpin(
    tickets: TicketInventory[],
    breaks: BreakDetails[],
    ticketQuantity: number,
    breakQuantity: number,
    riskProfile?: RiskProfile
  ): SpinResult {
    // Select winning ticket
    const winningTicket = this.selectWinningTicket(tickets, ticketQuantity, riskProfile);

    // Select winning break
    const winningBreak = this.selectWinningBreak(breaks, breakQuantity, riskProfile);

    // Calculate total value
    const totalValue = (winningTicket.price * ticketQuantity) + (winningBreak.price * breakQuantity);

    return {
      tickets: winningTicket,
      break: winningBreak,
      totalValue,
    };
  }

  private selectWinningTicket(
    tickets: TicketInventory[],
    quantity: number,
    riskProfile?: RiskProfile
  ): TicketInventory {
    // Filter tickets by quantity and risk profile
    let eligibleTickets = tickets.filter(t => t.quantity >= quantity);

    if (riskProfile?.minSeatQuality) {
      eligibleTickets = this.filterByMinQuality(eligibleTickets, riskProfile.minSeatQuality);
    }

    if (riskProfile?.preferredSections && riskProfile.preferredSections.length > 0) {
      const preferred = eligibleTickets.filter(t =>
        riskProfile.preferredSections!.includes(t.section)
      );
      if (preferred.length > 0) {
        eligibleTickets = preferred;
      }
    }

    // Weight selection based on price (lower prices more likely)
    return this.weightedRandomSelection(eligibleTickets, 'ticket', riskProfile);
  }

  private selectWinningBreak(
    breaks: BreakDetails[],
    quantity: number,
    riskProfile?: RiskProfile
  ): BreakDetails {
    let eligibleBreaks = [...breaks];

    // Apply cap if specified
    if (riskProfile?.capBreakWin) {
      eligibleBreaks = eligibleBreaks.filter(b => b.price <= riskProfile.capBreakWin!);
    }

    // Weight selection based on price
    return this.weightedRandomSelection(eligibleBreaks, 'break', riskProfile);
  }

  private weightedRandomSelection<T extends { price: number }>(
    items: T[],
    type: 'ticket' | 'break',
    riskProfile?: RiskProfile
  ): T {
    if (items.length === 0) {
      throw new Error(`No eligible ${type}s available`);
    }

    if (items.length === 1) {
      return items[0];
    }

    // Sort by price
    const sorted = [...items].sort((a, b) => a.price - b.price);

    // Create weight distribution
    // Lower prices get higher weights (more likely to be selected)
    const weights = sorted.map((_, index) => {
      const position = index / sorted.length;

      // Different curves for different risk profiles
      if (type === 'ticket' && riskProfile?.uncapTickets) {
        // More aggressive curve - allows for bigger wins
        return Math.pow(1 - position, 1.5);
      }

      // Standard curve - favors lower/middle prices
      return Math.pow(1 - position, 2.5);
    });

    // Normalize weights
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);

    // Select based on weighted random
    const rand = this.random();
    let cumulative = 0;

    for (let i = 0; i < sorted.length; i++) {
      cumulative += normalizedWeights[i];
      if (rand <= cumulative) {
        return sorted[i];
      }
    }

    // Fallback (shouldn't reach here)
    return sorted[sorted.length - 1];
  }

  private filterByMinQuality(tickets: TicketInventory[], minQuality: string): TicketInventory[] {
    const qualityScore = (section: string): number => {
      const lower = section.toLowerCase();
      if (lower.includes('floor') || lower.includes('court') || lower.includes('field')) return 10;
      if (lower.includes('club') || lower.includes('premium') || lower.includes('vip')) return 9;
      if (lower.includes('lower') || lower.includes('100')) return 7;
      if (lower.includes('mezzanine') || lower.includes('200')) return 5;
      if (lower.includes('upper') || lower.includes('300') || lower.includes('400')) return 3;
      return 1;
    };

    const minScore = qualityScore(minQuality);
    return tickets.filter(t => qualityScore(t.section) >= minScore);
  }

  generateSpinAnimation(): {
    duration: number;
    ticketFrames: number;
    breakFrames: number;
  } {
    // Generate random animation parameters
    const duration = 3000 + this.random() * 2000; // 3-5 seconds
    const ticketFrames = Math.floor(20 + this.random() * 10); // 20-30 frames
    const breakFrames = Math.floor(20 + this.random() * 10); // 20-30 frames

    return {
      duration,
      ticketFrames,
      breakFrames,
    };
  }
}

export const spinEngine = new SpinEngine();