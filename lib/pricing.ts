import { TicketGroup, CardBreak, TicketLevel, SpecialPrize } from '@prisma/client';

/**
 * Calculate pricing based on currently available inventory only
 * This ensures pricing adjusts dynamically as inventory is sold
 */

interface PricingResult {
  avgTicketPrice: number;
  avgBreakValue: number;
  totalBundleValue: number;
  spinPricePerBundle: number;
  availableTickets: number;
  availableBreaks: number;
}

/**
 * Calculate average price for available tickets only
 */
export function calculateAvailableTicketPrice(ticketGroups: TicketGroup[]): {
  avgPrice: number;
  totalAvailable: number;
  totalValue: number;
} {
  // Filter for available tickets only
  const availableGroups = ticketGroups.filter(group => group.status === 'AVAILABLE');

  if (availableGroups.length === 0) {
    return { avgPrice: 0, totalAvailable: 0, totalValue: 0 };
  }

  const totalValue = availableGroups.reduce((sum, group) => {
    return sum + (group.pricePerSeat * group.quantity);
  }, 0);

  const totalAvailable = availableGroups.reduce((sum, group) => {
    return sum + group.quantity;
  }, 0);

  const avgPrice = totalAvailable > 0 ? totalValue / totalAvailable : 0;

  return { avgPrice, totalAvailable, totalValue };
}

/**
 * Calculate average price from ticket levels ONLY (not special prizes)
 * This gives us the true average ticket price
 */
export function calculateLevelBasedTicketPrice(
  ticketLevels: TicketLevel[],
  specialPrizes: SpecialPrize[]
): {
  avgPrice: number;
  totalAvailable: number;
  totalValue: number;
} {
  // Calculate total value and quantity from ticket levels ONLY
  const levelTotalValue = ticketLevels.reduce((sum, level) => {
    return sum + (level.pricePerSeat * level.quantity);
  }, 0);

  const levelTotalQuantity = ticketLevels.reduce((sum, level) => {
    return sum + level.quantity;
  }, 0);

  // For average TICKET price, we only use ticket levels
  // Special prizes are tracked separately
  const avgPrice = levelTotalQuantity > 0 ? levelTotalValue / levelTotalQuantity : 0;

  // But for total available items, we include everything
  const prizeTotalQuantity = specialPrizes.reduce((sum, prize) => {
    return sum + prize.quantity;
  }, 0);

  const totalAvailable = levelTotalQuantity + prizeTotalQuantity;

  // Total value includes special prizes for bundle calculations
  const prizeTotalValue = specialPrizes.reduce((sum, prize) => {
    return sum + (prize.value * prize.quantity);
  }, 0);

  const totalValue = levelTotalValue + prizeTotalValue;

  return { avgPrice, totalAvailable, totalValue };
}

/**
 * Calculate average value for available breaks only
 */
export function calculateAvailableBreakValue(cardBreaks: CardBreak[]): {
  avgValue: number;
  totalAvailable: number;
  totalValue: number;
} {
  // Filter for available breaks only
  const availableBreaks = cardBreaks.filter(breakItem => breakItem.status === 'AVAILABLE');

  if (availableBreaks.length === 0) {
    return { avgValue: 0, totalAvailable: 0, totalValue: 0 };
  }

  const totalValue = availableBreaks.reduce((sum, breakItem) => {
    return sum + (breakItem.breakValue || 0);
  }, 0);

  const totalAvailable = availableBreaks.length;
  const avgValue = totalAvailable > 0 ? totalValue / totalAvailable : 0;

  return { avgValue, totalAvailable, totalValue };
}

/**
 * Calculate the bundle pricing based on available inventory
 * A bundle consists of 1 ticket + associated breaks
 */
export function calculateBundlePricing(
  ticketGroups: TicketGroup[],
  cardBreaks: CardBreak[],
  marginPercentage: number = 30, // Default 30% margin instead of 35%
  ticketLevels?: TicketLevel[],
  specialPrizes?: SpecialPrize[]
): PricingResult {
  // Use new level-based calculation if ticketLevels are provided
  const ticketPricing = (ticketLevels && ticketLevels.length > 0)
    ? calculateLevelBasedTicketPrice(ticketLevels, specialPrizes || [])
    : calculateAvailableTicketPrice(ticketGroups);

  const breakPricing = calculateAvailableBreakValue(cardBreaks);

  // Calculate average bundle value (1 ticket + average break value)
  const totalBundleValue = ticketPricing.avgPrice + breakPricing.avgValue;

  // Apply margin for spin price (e.g., 30% markup)
  const marginMultiplier = 1 + (marginPercentage / 100);
  const spinPricePerBundle = totalBundleValue * marginMultiplier;

  return {
    avgTicketPrice: ticketPricing.avgPrice,
    avgBreakValue: breakPricing.avgValue,
    totalBundleValue,
    spinPricePerBundle,
    availableTickets: ticketPricing.totalAvailable,
    availableBreaks: breakPricing.totalAvailable
  };
}

/**
 * Recalculate pricing after inventory changes
 * This should be called whenever tickets or breaks are sold/reserved
 */
export async function recalculateGamePricing(
  gameId: string,
  prisma: any
): Promise<PricingResult> {
  // Fetch current inventory including new models
  const game = await prisma.dailyGame.findUnique({
    where: { id: gameId },
    include: {
      ticketGroups: true,
      ticketLevels: true,
      specialPrizes: true,
      cardBreaks: true
    }
  });

  if (!game) {
    throw new Error('Game not found');
  }

  // Calculate new pricing based on available inventory
  const pricing = calculateBundlePricing(
    game.ticketGroups,
    game.cardBreaks,
    30,
    game.ticketLevels,
    game.specialPrizes
  );

  // Update the game with new pricing
  await prisma.dailyGame.update({
    where: { id: gameId },
    data: {
      avgTicketPrice: pricing.avgTicketPrice,
      avgBreakValue: pricing.avgBreakValue,
      spinPricePerBundle: pricing.spinPricePerBundle
    }
  });

  return pricing;
}