/**
 * Standard Memorabilia Configuration
 * Default memorabilia items for each sport when no custom items are specified
 */

export interface StandardMemorabiliaItem {
  name: string;
  description: string;
  value: number;
  imageUrl: string;
  category: string;
}

export const STANDARD_MEMORABILIA: Record<string, StandardMemorabiliaItem> = {
  NFL: {
    name: "NFL Trading Cards Pack",
    description: "Standard pack of NFL trading cards featuring current players",
    value: 25,
    imageUrl: "/memorabilia/nfl-cards.jpg",
    category: "trading_cards"
  },
  NBA: {
    name: "NBA Trading Cards Pack",
    description: "Standard pack of NBA trading cards featuring current players",
    value: 25,
    imageUrl: "/memorabilia/nba-cards.jpg",
    category: "trading_cards"
  },
  MLB: {
    name: "MLB Trading Cards Pack",
    description: "Standard pack of MLB trading cards featuring current players",
    value: 25,
    imageUrl: "/memorabilia/mlb-cards.jpg",
    category: "trading_cards"
  },
  NHL: {
    name: "NHL Trading Cards Pack",
    description: "Standard pack of NHL trading cards featuring current players",
    value: 25,
    imageUrl: "/memorabilia/nhl-cards.jpg",
    category: "trading_cards"
  },
  SOCCER: {
    name: "Soccer Trading Cards Pack",
    description: "Standard pack of soccer trading cards featuring current players",
    value: 25,
    imageUrl: "/memorabilia/soccer-cards.jpg",
    category: "trading_cards"
  },
  OTHER: {
    name: "Sports Trading Cards Pack",
    description: "Standard pack of sports trading cards",
    value: 25,
    imageUrl: "/memorabilia/generic-cards.jpg",
    category: "trading_cards"
  }
};

/**
 * Get standard memorabilia item for a sport
 */
export function getStandardMemorabiliaForSport(sport: string): StandardMemorabiliaItem {
  const normalizedSport = sport.toUpperCase();
  return STANDARD_MEMORABILIA[normalizedSport] || STANDARD_MEMORABILIA.OTHER;
}

/**
 * VIP Win Configuration
 * Special high-value prize that can be won with low probability
 */
export const VIP_WIN_CONFIG = {
  probability: 0.0002, // 0.02% chance
  multiplier: 5, // VIP tickets are worth 5x the average
  description: "VIP Premium Experience - Top tier seats with exclusive access"
};
