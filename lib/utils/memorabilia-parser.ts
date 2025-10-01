import { TierLevel } from '@prisma/client';

export interface ParsedMemorabiliaItem {
  name: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  attributes: string[];
  rawText: string;
}

export interface MemorabiliaItemInput {
  id: string;
  name: string;
  description: string;
  value: number;
  quantity: number;
  imageUrl?: string;
  tierLevel?: TierLevel;
  tierPriority?: number;
  availableUnits?: number[];
  availablePacks?: string[];
}

// Parse memorabilia/card data
export function parseMemorabiliaData(rawData: string): ParsedMemorabiliaItem[] {
  const items: ParsedMemorabiliaItem[] = [];

  // Split by lines
  const lines = rawData.split('\n').map(l => l.trim()).filter(l => l);

  let currentItem: Partial<ParsedMemorabiliaItem> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (!line) continue;

    // Check if this line is "Almost Gone" or similar
    if (/^almost gone$/i.test(line)) {
      // Add attribute to the most recent item
      if (items.length > 0) {
        const lastItem = items[items.length - 1];
        if (!lastItem.attributes.includes('Limited Availability')) {
          lastItem.attributes.push('Limited Availability');
        }
      }
      continue;
    }

    // Check if this line is a price (starts with $ and contains numbers)
    const priceMatch = line.match(/^\$([\d,]+(?:\.\d{1,2})?)$/);

    if (priceMatch) {
      // This is a price for the current item
      if (currentItem && currentItem.name) {
        currentItem.price = parseFloat(priceMatch[1].replace(/,/g, ''));

        // Save the completed item
        items.push(completeMemorabiliaItem(currentItem));
        currentItem = null;
      }
    } else {
      // This is an item name/description
      // Start a new item
      currentItem = {
        name: line,
        description: line,
        attributes: [],
        rawText: line,
        quantity: 1
      };
    }
  }

  // Handle any remaining item without a price
  if (currentItem && currentItem.name) {
    // Try to find a price in the name itself (shouldn't happen with proper formatting)
    console.warn('Item without price:', currentItem.name);
  }

  return items;
}

function completeMemorabiliaItem(partial: Partial<ParsedMemorabiliaItem>): ParsedMemorabiliaItem {
  // Extract additional attributes from the name
  const attributes = partial.attributes || [];
  const name = partial.name || '';

  // Check for common card attributes
  if (/signed|autograph|auto/i.test(name)) attributes.push('Autographed');
  if (/psa|beckett|bas|jsa/i.test(name)) attributes.push('Authenticated');
  if (/grade\s*10|gem\s*mint/i.test(name)) attributes.push('Grade 10');
  if (/#d\s*\d+\/\d+|\/\d+/i.test(name)) attributes.push('Numbered');
  if (/rc|rookie/i.test(name)) attributes.push('Rookie Card');
  if (/patch/i.test(name)) attributes.push('Patch');
  if (/refractor/i.test(name)) attributes.push('Refractor');
  if (/prizm/i.test(name)) attributes.push('Prizm');
  if (/chrome/i.test(name)) attributes.push('Chrome');

  // Extract card year if present
  const yearMatch = name.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    attributes.push(`${yearMatch[1]} Release`);
  }

  // Extract player name (usually first few words before card details)
  let shortName = name;
  const playerMatch = name.match(/^([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (playerMatch) {
    shortName = playerMatch[1] + ' Card';
    // Add rest as description details
    const details = name.substring(playerMatch[1].length).trim();
    if (details) {
      shortName += ' - ' + details.substring(0, 50) + (details.length > 50 ? '...' : '');
    }
  }

  return {
    name: shortName.substring(0, 100), // Limit name length
    description: partial.description || name,
    price: partial.price || 0,
    quantity: partial.quantity || 1,
    imageUrl: partial.imageUrl,
    attributes: [...new Set(attributes)], // Remove duplicates
    rawText: partial.rawText || ''
  };
}

// Classify memorabilia tier based on value
export function classifyMemorabiliaier(value: number): {
  tierLevel: TierLevel;
  tierPriority: number;
} {
  if (value >= 500) {
    return {
      tierLevel: TierLevel.VIP_ITEM,
      tierPriority: 1
    };
  } else if (value >= 200) {
    return {
      tierLevel: TierLevel.GOLD_LEVEL,
      tierPriority: 1
    };
  } else {
    return {
      tierLevel: TierLevel.UPPER_DECK,
      tierPriority: 1
    };
  }
}

// Determine available packs based on tier
export function getMemorabiliaPacksByTier(tierLevel: TierLevel): string[] {
  switch (tierLevel) {
    case TierLevel.VIP_ITEM:
      return ['gold']; // VIP items only in Gold packs
    case TierLevel.GOLD_LEVEL:
      return ['red', 'gold']; // Gold level in Red and Gold packs
    case TierLevel.UPPER_DECK:
      return ['blue', 'red', 'gold']; // Upper deck in all packs
    default:
      return ['blue', 'red', 'gold'];
  }
}

// Convert to memorabilia inputs for the form
export function generateMemorabiliaInputs(items: ParsedMemorabiliaItem[]): MemorabiliaItemInput[] {
  return items.map((item, idx) => {
    const classification = classifyMemorabiliaier(item.price);
    const availablePacks = getMemorabiliaPacksByTier(classification.tierLevel);

    return {
      id: `bulk-mem-${idx}-${Date.now()}`,
      name: item.name,
      description: item.description,
      value: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      tierLevel: classification.tierLevel,
      tierPriority: classification.tierPriority,
      availableUnits: [1, 2, 3, 4], // Default to all bundle sizes
      availablePacks
    };
  });
}

// Group items by price range for preview
export function groupMemorabiliaByPriceRange(items: ParsedMemorabiliaItem[]): Map<string, ParsedMemorabiliaItem[]> {
  const grouped = new Map<string, ParsedMemorabiliaItem[]>();

  for (const item of items) {
    let rangeKey: string;

    if (item.price < 50) rangeKey = 'Under $50';
    else if (item.price < 100) rangeKey = '$50 - $100';
    else if (item.price < 200) rangeKey = '$100 - $200';
    else if (item.price < 500) rangeKey = '$200 - $500';
    else if (item.price < 1000) rangeKey = '$500 - $1,000';
    else rangeKey = 'Over $1,000';

    if (!grouped.has(rangeKey)) {
      grouped.set(rangeKey, []);
    }
    grouped.get(rangeKey)!.push(item);
  }

  return grouped;
}

// Calculate statistics
export function calculateMemorabiliaStats(items: ParsedMemorabiliaItem[]): {
  totalItems: number;
  totalValue: number;
  avgValue: number;
  minValue: number;
  maxValue: number;
  autographedCount: number;
  authenticatedCount: number;
} {
  if (items.length === 0) {
    return {
      totalItems: 0,
      totalValue: 0,
      avgValue: 0,
      minValue: 0,
      maxValue: 0,
      autographedCount: 0,
      authenticatedCount: 0
    };
  }

  let totalValue = 0;
  let minValue = Infinity;
  let maxValue = 0;
  let autographedCount = 0;
  let authenticatedCount = 0;

  for (const item of items) {
    const itemValue = item.price * item.quantity;
    totalValue += itemValue;
    minValue = Math.min(minValue, item.price);
    maxValue = Math.max(maxValue, item.price);

    if (item.attributes.includes('Autographed')) autographedCount++;
    if (item.attributes.includes('Authenticated')) authenticatedCount++;
  }

  return {
    totalItems: items.length,
    totalValue,
    avgValue: Math.round(totalValue / items.length),
    minValue,
    maxValue,
    autographedCount,
    authenticatedCount
  };
}

// Validate parsed items
export function validateMemorabiliaItems(items: ParsedMemorabiliaItem[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (items.length === 0) {
    errors.push('No valid memorabilia items found in the data');
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!item.name || item.name.trim() === '') {
      errors.push(`Item #${i + 1} missing name`);
    }

    if (item.price <= 0) {
      errors.push(`Invalid price for ${item.name || `item #${i + 1}`}`);
    }

    if (item.price > 10000) {
      warnings.push(`Very high price ($${item.price}) for ${item.name} - please verify`);
    }

    if (!item.description) {
      warnings.push(`${item.name || `Item #${i + 1}`} missing description`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Format price for display
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}