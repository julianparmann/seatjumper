import { TierLevel } from '@prisma/client';

/**
 * Simple price-based ticket tier classification
 */
export function classifyTicketTier(pricePerSeat: number): { tierLevel: TierLevel; tierPriority: number } {
  // VIP Item: $500+
  if (pricePerSeat >= 500) {
    return {
      tierLevel: TierLevel.VIP_ITEM,
      tierPriority: 1
    };
  }

  // Gold Level: $200-$499
  if (pricePerSeat >= 200) {
    return {
      tierLevel: TierLevel.GOLD_LEVEL,
      tierPriority: 2
    };
  }

  // Upper Deck: Under $200
  return {
    tierLevel: TierLevel.UPPER_DECK,
    tierPriority: 3
  };
}

/**
 * Get display information for a tier
 */
export function getTierDisplay(tierLevel: TierLevel | null | undefined) {
  switch (tierLevel) {
    case TierLevel.VIP_ITEM:
      return {
        label: 'VIP Item',
        color: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
        borderColor: 'border-yellow-400',
        textColor: 'text-yellow-400',
        icon: '👑',
        priority: 1
      };
    case TierLevel.GOLD_LEVEL:
      return {
        label: 'Gold Level',
        color: 'bg-gradient-to-r from-gray-300 to-gray-400',
        borderColor: 'border-gray-300',
        textColor: 'text-gray-300',
        icon: '⭐',
        priority: 2
      };
    case TierLevel.UPPER_DECK:
      return {
        label: 'Upper Deck',
        color: 'bg-blue-600',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-400',
        icon: '🎫',
        priority: 3
      };
    default:
      return {
        label: 'Standard',
        color: 'bg-gray-600',
        borderColor: 'border-gray-500',
        textColor: 'text-gray-400',
        icon: '🎟️',
        priority: 4
      };
  }
}