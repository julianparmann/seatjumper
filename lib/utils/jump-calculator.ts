/**
 * Jump Price Calculator
 *
 * Core pricing engine for SeatJumper - calculates jump prices based on user's
 * selected seat pool. Never exposes wholesale prices to frontend.
 */

export interface MercuryTicketGroup {
  exchangeTicketGroupId: number;
  section: string;
  row: string;
  availableQuantity: number;
  purchasableQuantities: number[];
  unitPrice: {
    wholesalePrice: {
      value: number;
      currencyCode: string;
    };
    retailPrice?: {
      value: number;
      currencyCode: string;
    };
  };
  standardSection?: string;
  canonicalSection?: string;
}

export interface JumpPriceResult {
  quantity: number;
  jumpPrice: number;
  poolSize: number; // Number of valid ticket groups for this quantity
  available: boolean;
  // Admin-only fields
  wholesalePrice?: number;
  marginAmount?: number;
}

export interface SectionSummary {
  section: string;
  displayName: string; // User-friendly name
  optionCount: number; // Total ticket groups in section
  quantitiesAvailable: number[]; // Unique quantities available
  // Admin-only pricing data
  priceRange?: {
    min: number;
    max: number;
    avg: number;
  };
}

/**
 * Calculate jump prices for different quantities based on selected ticket groups
 * @param selectedGroups - Array of Mercury ticket groups selected by user
 * @param marginPercent - Profit margin percentage (default 30%)
 * @param includeAdminData - Include wholesale pricing data (admin only)
 * @returns Array of jump prices for each valid quantity
 */
export function calculateJumpPrices(
  selectedGroups: MercuryTicketGroup[],
  marginPercent: number = 30,
  includeAdminData: boolean = false
): JumpPriceResult[] {
  if (!selectedGroups || selectedGroups.length === 0) {
    return [];
  }

  // Find all unique quantities available across selected groups
  const allQuantities = new Set<number>();
  selectedGroups.forEach(group => {
    group.purchasableQuantities?.forEach(qty => allQuantities.add(qty));
  });

  const results: JumpPriceResult[] = [];
  const margin = 1 + (marginPercent / 100);

  // Calculate jump price for each available quantity
  Array.from(allQuantities).sort((a, b) => a - b).forEach(quantity => {
    // Filter groups that can accommodate this quantity
    const validGroups = selectedGroups.filter(g =>
      g.purchasableQuantities?.includes(quantity)
    );

    if (validGroups.length === 0) {
      return;
    }

    // Calculate weighted average by availability
    const weightedSum = validGroups.reduce((sum, group) => {
      const weight = group.availableQuantity;
      const price = group.unitPrice?.wholesalePrice?.value || 0;
      return sum + (price * weight);
    }, 0);

    const totalWeight = validGroups.reduce((sum, g) =>
      sum + g.availableQuantity, 0
    );

    if (totalWeight === 0) {
      return;
    }

    const avgWholesale = weightedSum / totalWeight;
    const jumpPrice = Math.round(avgWholesale * quantity * margin);

    const result: JumpPriceResult = {
      quantity,
      jumpPrice,
      poolSize: validGroups.length,
      available: true
    };

    // Include admin data if requested
    if (includeAdminData) {
      result.wholesalePrice = Math.round(avgWholesale * quantity * 100) / 100;
      result.marginAmount = Math.round((jumpPrice - avgWholesale * quantity) * 100) / 100;
    }

    results.push(result);
  });

  return results;
}

/**
 * Group ticket groups by section for UI display
 * @param ticketGroups - All available ticket groups from Mercury
 * @param includeAdminData - Include pricing data for admin users
 * @returns Array of section summaries for UI
 */
export function groupBySection(
  ticketGroups: MercuryTicketGroup[],
  includeAdminData: boolean = false
): SectionSummary[] {
  const sectionMap = new Map<string, {
    groups: MercuryTicketGroup[];
    quantities: Set<number>;
  }>();

  ticketGroups.forEach(group => {
    // Use standardSection if available, otherwise canonicalSection or section
    const sectionKey = group.standardSection || group.canonicalSection || group.section;

    if (!sectionMap.has(sectionKey)) {
      sectionMap.set(sectionKey, {
        groups: [],
        quantities: new Set()
      });
    }

    const section = sectionMap.get(sectionKey)!;
    section.groups.push(group);
    group.purchasableQuantities?.forEach(qty => section.quantities.add(qty));
  });

  // Convert to array of summaries
  const summaries: SectionSummary[] = [];
  sectionMap.forEach((data, section) => {
    const summary: SectionSummary = {
      section,
      displayName: formatSectionName(section),
      optionCount: data.groups.length,
      quantitiesAvailable: Array.from(data.quantities).sort((a, b) => a - b)
    };

    // Add pricing data for admin users
    if (includeAdminData && data.groups.length > 0) {
      const prices = data.groups.map(g => g.unitPrice?.wholesalePrice?.value || 0);
      const validPrices = prices.filter(p => p > 0);

      if (validPrices.length > 0) {
        summary.priceRange = {
          min: Math.min(...validPrices),
          max: Math.max(...validPrices),
          avg: validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length
        };
      }
    }

    summaries.push(summary);
  });

  // Sort by section name
  return summaries.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/**
 * Format section name for user display
 * @param section - Raw section name from Mercury
 * @returns User-friendly section name
 */
function formatSectionName(section: string): string {
  // Remove special characters and format nicely
  return section
    .replace(/\$/g, ' ')
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Select a random ticket group from the pool for purchase
 * @param selectedGroups - User's filtered ticket groups
 * @param quantity - Desired quantity
 * @returns Randomly selected ticket group or null
 */
export function selectRandomFromPool(
  selectedGroups: MercuryTicketGroup[],
  quantity: number
): MercuryTicketGroup | null {
  // Filter for groups that support the requested quantity
  const validGroups = selectedGroups.filter(g =>
    g.purchasableQuantities?.includes(quantity) &&
    g.availableQuantity >= quantity
  );

  if (validGroups.length === 0) {
    return null;
  }

  // Weight selection by available quantity (more inventory = higher chance)
  const totalWeight = validGroups.reduce((sum, g) => sum + g.availableQuantity, 0);
  let random = Math.random() * totalWeight;

  for (const group of validGroups) {
    random -= group.availableQuantity;
    if (random <= 0) {
      return group;
    }
  }

  // Fallback to last group (shouldn't happen)
  return validGroups[validGroups.length - 1];
}

/**
 * Calculate savings for bulk purchases
 * @param jumpPrices - Array of jump price results
 * @returns Savings amount for quantities > 1
 */
export function calculateBulkSavings(jumpPrices: JumpPriceResult[]): Map<number, number> {
  const savings = new Map<number, number>();

  const singlePrice = jumpPrices.find(p => p.quantity === 1);
  if (!singlePrice) return savings;

  jumpPrices.forEach(price => {
    if (price.quantity > 1) {
      const expectedPrice = singlePrice.jumpPrice * price.quantity;
      const actualPrice = price.jumpPrice;
      const saved = expectedPrice - actualPrice;

      if (saved > 0) {
        savings.set(price.quantity, saved);
      }
    }
  });

  return savings;
}