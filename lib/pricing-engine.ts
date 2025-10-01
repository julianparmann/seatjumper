import { EventDetails, BreakDetails, RiskProfile, TicketInventory } from '@/types';

export class PricingEngine {
  private baseMargin: number = 0.35; // 35% base margin
  private riskMultiplier: number = 1.2; // Additional multiplier for high-variance events

  calculateSpinPrice(
    event: EventDetails,
    breaks: BreakDetails[],
    ticketQuantity: number,
    breakQuantity: number,
    riskProfile?: RiskProfile
  ): {
    spinPrice: number;
    expectedTicketCost: number;
    expectedBreakCost: number;
    potentialMinValue: number;
    potentialMaxValue: number;
    margin: number;
  } {
    // Calculate average ticket cost
    const ticketPrices = this.getFilteredTicketPrices(event, ticketQuantity, riskProfile);
    const avgTicketPrice = this.calculateWeightedAverage(ticketPrices);
    const expectedTicketCost = avgTicketPrice * ticketQuantity;

    // Calculate average break cost
    const breakPrices = this.getFilteredBreakPrices(breaks, breakQuantity, riskProfile);
    const avgBreakPrice = this.calculateWeightedAverage(breakPrices);
    const expectedBreakCost = avgBreakPrice * breakQuantity;

    // Calculate variance and risk
    const ticketVariance = this.calculateVariance(ticketPrices);
    const breakVariance = this.calculateVariance(breakPrices);
    const totalVariance = ticketVariance + breakVariance;

    // Adjust margin based on risk
    const riskAdjustedMargin = this.calculateRiskAdjustedMargin(totalVariance);

    // Calculate total spin price
    const baseCost = expectedTicketCost + expectedBreakCost;
    const margin = baseCost * riskAdjustedMargin;
    const spinPrice = baseCost + margin;

    // Calculate potential win ranges
    const potentialMinValue = this.calculateMinPotentialValue(event, breaks, ticketQuantity, breakQuantity, riskProfile);
    const potentialMaxValue = this.calculateMaxPotentialValue(event, breaks, ticketQuantity, breakQuantity, riskProfile);

    return {
      spinPrice: Math.round(spinPrice * 100) / 100,
      expectedTicketCost,
      expectedBreakCost,
      potentialMinValue,
      potentialMaxValue,
      margin: riskAdjustedMargin,
    };
  }

  private getFilteredTicketPrices(
    event: EventDetails,
    quantity: number,
    riskProfile?: RiskProfile
  ): number[] {
    let tickets = event.tickets || [];

    // Filter by quantity availability
    tickets = tickets.filter(t => t.quantity >= quantity);

    // Apply risk profile filters
    if (riskProfile?.minSeatQuality) {
      tickets = this.filterByQuality(tickets, riskProfile.minSeatQuality);
    }

    if (riskProfile?.preferredSections && riskProfile.preferredSections.length > 0) {
      const preferred = tickets.filter(t =>
        riskProfile.preferredSections!.includes(t.section)
      );
      if (preferred.length > 0) {
        tickets = preferred;
      }
    }

    return tickets.map(t => t.price);
  }

  private getFilteredBreakPrices(
    breaks: BreakDetails[],
    quantity: number,
    riskProfile?: RiskProfile
  ): number[] {
    let prices = breaks.map(b => b.price);

    // Apply cap if specified
    if (riskProfile?.capBreakWin) {
      prices = prices.filter(p => p <= riskProfile.capBreakWin!);
    }

    return prices;
  }

  private calculateWeightedAverage(prices: number[]): number {
    if (prices.length === 0) return 0;

    // Sort prices
    const sorted = [...prices].sort((a, b) => a - b);

    // Give more weight to middle prices (reduce impact of outliers)
    const weights = sorted.map((_, index) => {
      const position = index / sorted.length;
      // Bell curve weighting
      return Math.exp(-Math.pow((position - 0.5) * 4, 2));
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const weightedSum = sorted.reduce((sum, price, index) =>
      sum + price * weights[index], 0
    );

    return weightedSum / totalWeight;
  }

  private calculateVariance(prices: number[]): number {
    if (prices.length === 0) return 0;

    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const squaredDiffs = prices.map(p => Math.pow(p - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / prices.length;
  }

  private calculateRiskAdjustedMargin(variance: number): number {
    // Higher variance = higher margin needed
    const varianceMultiplier = Math.min(
      1 + (variance / 10000), // Cap the multiplier
      2 // Never more than double
    );

    return this.baseMargin * varianceMultiplier;
  }

  private filterByQuality(tickets: TicketInventory[], minQuality: string): TicketInventory[] {
    // Simple quality scoring based on section names
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

  private calculateMinPotentialValue(
    event: EventDetails,
    breaks: BreakDetails[],
    ticketQuantity: number,
    breakQuantity: number,
    riskProfile?: RiskProfile
  ): number {
    const ticketPrices = this.getFilteredTicketPrices(event, ticketQuantity, riskProfile);
    const breakPrices = this.getFilteredBreakPrices(breaks, breakQuantity, riskProfile);

    const minTicketPrice = Math.min(...ticketPrices) * ticketQuantity;
    const minBreakPrice = Math.min(...breakPrices) * breakQuantity;

    return minTicketPrice + minBreakPrice;
  }

  private calculateMaxPotentialValue(
    event: EventDetails,
    breaks: BreakDetails[],
    ticketQuantity: number,
    breakQuantity: number,
    riskProfile?: RiskProfile
  ): number {
    const ticketPrices = this.getFilteredTicketPrices(event, ticketQuantity, riskProfile);
    const breakPrices = this.getFilteredBreakPrices(breaks, breakQuantity, riskProfile);

    let maxTicketPrice = Math.max(...ticketPrices) * ticketQuantity;
    let maxBreakPrice = Math.max(...breakPrices) * breakQuantity;

    // If uncapped tickets in risk profile
    if (riskProfile?.uncapTickets && event.tickets) {
      const allPrices = event.tickets.map(t => t.price);
      maxTicketPrice = Math.max(...allPrices) * ticketQuantity;
    }

    return maxTicketPrice + maxBreakPrice;
  }

  calculateWinProbabilities(
    potentialMinValue: number,
    potentialMaxValue: number,
    spinPrice: number
  ): {
    breakEvenProbability: number;
    doubleProbability: number;
    tripleProbability: number;
  } {
    const range = potentialMaxValue - potentialMinValue;

    // Calculate probabilities based on normal distribution
    // Assuming prizes follow a normal distribution centered slightly below break-even
    const breakEvenValue = spinPrice;
    const doubleValue = spinPrice * 2;
    const tripleValue = spinPrice * 3;

    // Simplified probability calculations
    const breakEvenProbability = 0.45; // 45% chance to break even or better
    const doubleProbability = 0.15; // 15% chance to double or better
    const tripleProbability = 0.05; // 5% chance to triple or better

    return {
      breakEvenProbability,
      doubleProbability,
      tripleProbability,
    };
  }
}

export const pricingEngine = new PricingEngine();