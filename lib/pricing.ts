import { TicketGroup, CardBreak, TicketLevel, SpecialPrize } from '@prisma/client';

/**
 * Calculate pricing based on currently available inventory only
 * This ensures pricing adjusts dynamically as inventory is sold
 */

interface PricingResult {
  avgTicketPrice: number;
  avgBreakValue: number; // Kept for compatibility but will be 0
  totalBundleValue: number;
  spinPricePerBundle: number;
  availableTickets: number;
  availableBreaks: number; // Kept for compatibility but will be 0
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
 * A bundle consists of tickets only (memorabilia removed)
 */
export function calculateBundlePricing(
  ticketGroups: TicketGroup[],
  cardBreaks: CardBreak[],
  marginPercentage: number = 30, // Default 30% margin
  ticketLevels?: TicketLevel[],
  specialPrizes?: SpecialPrize[]
): PricingResult {
  // Use new level-based calculation if ticketLevels are provided
  const ticketPricing = (ticketLevels && ticketLevels.length > 0)
    ? calculateLevelBasedTicketPrice(ticketLevels, specialPrizes || [])
    : calculateAvailableTicketPrice(ticketGroups);

  // Memorabilia removed - set to 0
  // const breakPricing = calculateAvailableBreakValue(cardBreaks);
  const breakPricing = { avgValue: 0, totalAvailable: 0, totalValue: 0 };

  // Calculate average bundle value (tickets only)
  const totalBundleValue = ticketPricing.avgPrice; // No break value added

  // Apply margin for spin price (e.g., 30% markup)
  const marginMultiplier = 1 + (marginPercentage / 100);
  const spinPricePerBundle = totalBundleValue * marginMultiplier;

  return {
    avgTicketPrice: ticketPricing.avgPrice,
    avgBreakValue: 0, // Memorabilia removed
    totalBundleValue,
    spinPricePerBundle,
    availableTickets: ticketPricing.totalAvailable,
    availableBreaks: 0 // Memorabilia removed
  };
}

/**
 * Calculate bundle-specific pricing based on ticket availability
 * Each bundle size should only consider tickets with sufficient quantity
 */
export interface BundleSpecificPricing {
  spinPrice1x: number;
  spinPrice2x: number;
  spinPrice3x: number;
  spinPrice4x: number;
}

export interface PackSpecificPricing {
  blue: BundleSpecificPricing;
  red: BundleSpecificPricing;
  gold: BundleSpecificPricing;
}

/**
 * Calculate pack-specific pricing based on available inventory
 * Each pack (blue, red, gold) has different available items based on availablePacks field
 */
export function calculatePackSpecificPricing(
  ticketLevels: TicketLevel[],
  ticketGroups: TicketGroup[],
  specialPrizes: SpecialPrize[],
  cardBreaks: CardBreak[],
  marginPercentage: number = 30
): PackSpecificPricing {
  const packs = ['blue', 'red', 'gold'];
  const packPrices: any = {};

  packs.forEach(pack => {
    const bundleSizes = [1, 2, 3, 4];
    const prices: any = {};

    // Calculate memorabilia value for this pack
    const packCardBreaks = cardBreaks.filter((item: any) => {
      const availablePacks = item.availablePacks as string[] || ['blue', 'red', 'gold'];
      return availablePacks.includes(pack) && item.status === 'AVAILABLE' && item.quantity > 0;
    });
    const breakPricing = calculateAvailableBreakValue(packCardBreaks);

    bundleSizes.forEach(bundleSize => {
      // Filter ticket levels for this pack and bundle size
      const eligibleTicketLevels = ticketLevels.filter((level: any) => {
        const availablePacks = level.availablePacks as string[] || ['blue', 'red', 'gold'];
        const availableUnits = level.availableUnits as number[] || [1, 2, 3, 4];
        return availablePacks.includes(pack) &&
               availableUnits.includes(bundleSize) &&
               level.quantity >= bundleSize;
      });

      // Filter special prizes for this pack and bundle size
      const eligibleSpecialPrizes = specialPrizes.filter((prize: any) => {
        const availableUnits = prize.availableUnits as number[] || [1, 2, 3, 4];
        return availableUnits.includes(bundleSize) &&
               prize.quantity >= bundleSize;
      });

      // Filter ticket groups for this pack and bundle size
      const eligibleTicketGroups = ticketGroups.filter((group: any) => {
        const availablePacks = group.availablePacks as string[] || ['blue', 'red', 'gold'];
        const availableUnits = group.availableUnits as number[] || [1, 2, 3, 4];
        return availablePacks.includes(pack) &&
               group.status === 'AVAILABLE' &&
               availableUnits.includes(bundleSize) &&
               group.quantity >= bundleSize;
      });

      // Calculate ticket pricing for this pack and bundle size
      let ticketPricing;
      if (eligibleTicketLevels.length > 0 || eligibleSpecialPrizes.length > 0) {
        ticketPricing = calculateLevelBasedTicketPrice(eligibleTicketLevels, eligibleSpecialPrizes);
      } else {
        // Fallback to ticket groups
        ticketPricing = calculateAvailableTicketPrice(eligibleTicketGroups);
      }

      // Calculate total bundle value (tickets + memorabilia, multiply by bundle size)
      const totalBundleValue = (ticketPricing.avgPrice + breakPricing.avgValue) * bundleSize;

      // Apply margin
      const marginMultiplier = 1 + (marginPercentage / 100);
      const spinPrice = totalBundleValue * marginMultiplier;

      prices[`spinPrice${bundleSize}x`] = spinPrice;
    });

    packPrices[pack] = prices;
  });

  return packPrices as PackSpecificPricing;
}

export function calculateBundleSpecificPricing(
  ticketLevels: TicketLevel[],
  ticketGroups: TicketGroup[],
  specialPrizes: SpecialPrize[],
  cardBreaks: CardBreak[],
  marginPercentage: number = 30,
  pack?: string // Optional pack parameter for pack-specific pricing
): BundleSpecificPricing {
  // If pack is specified, calculate pack-specific pricing
  if (pack && ['blue', 'red', 'gold'].includes(pack)) {
    const packPricing = calculatePackSpecificPricing(
      ticketLevels,
      ticketGroups,
      specialPrizes,
      cardBreaks,
      marginPercentage
    );
    return packPricing[pack as keyof PackSpecificPricing];
  }

  // Otherwise, calculate general pricing (all inventory)
  const bundleSizes = [1, 2, 3, 4];
  const prices: any = {};

  // Include memorabilia in general pricing
  const breakPricing = calculateAvailableBreakValue(cardBreaks);

  bundleSizes.forEach(bundleSize => {
    // Filter ticket levels that can support this bundle size
    const eligibleTicketLevels = ticketLevels.filter((level: any) => {
      // Check availableUnits if it exists, otherwise check quantity
      const availableUnits = level.availableUnits as number[] || [1, 2, 3, 4];
      const hasAvailableUnits = availableUnits.includes(bundleSize);
      const hasSufficientQuantity = level.quantity >= bundleSize;
      return hasAvailableUnits && hasSufficientQuantity;
    });

    // Filter special prizes that can support this bundle size
    const eligibleSpecialPrizes = specialPrizes.filter((prize: any) => {
      const availableUnits = prize.availableUnits as number[] || [1, 2, 3, 4];
      const hasAvailableUnits = availableUnits.includes(bundleSize);
      const hasSufficientQuantity = prize.quantity >= bundleSize;
      return hasAvailableUnits && hasSufficientQuantity;
    });

    // Filter ticket groups if needed (for fallback)
    const eligibleTicketGroups = ticketGroups.filter(group => {
      return group.status === 'AVAILABLE' && group.quantity >= bundleSize;
    });

    // Calculate ticket pricing for this bundle size
    let ticketPricing;
    if (eligibleTicketLevels.length > 0) {
      ticketPricing = calculateLevelBasedTicketPrice(eligibleTicketLevels, eligibleSpecialPrizes);
    } else {
      // Fallback to ticket groups
      ticketPricing = calculateAvailableTicketPrice(eligibleTicketGroups);
    }

    // Calculate total bundle value (tickets + memorabilia, multiply by bundle size)
    const totalBundleValue = (ticketPricing.avgPrice + breakPricing.avgValue) * bundleSize;

    // Apply margin
    const marginMultiplier = 1 + (marginPercentage / 100);
    const spinPrice = totalBundleValue * marginMultiplier;

    prices[`spinPrice${bundleSize}x`] = spinPrice;
  });

  return prices as BundleSpecificPricing;
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
      avgBreakValue: 0, // Memorabilia removed
      spinPricePerBundle: pricing.spinPricePerBundle
    }
  });

  return pricing;
}