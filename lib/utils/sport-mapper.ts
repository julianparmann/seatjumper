/**
 * Sport Mapping Utility
 * Maps Mercury/TicketNetwork category names to standardized sport types
 */

import { Sport } from '@prisma/client';

/**
 * Mercury category patterns mapped to our Sport enum
 */
const SPORT_PATTERNS: Record<Sport, string[]> = {
  NFL: ['nfl', 'football', 'raiders', 'chiefs', 'patriots'],
  NBA: ['nba', 'basketball', 'lakers', 'warriors', 'celtics'],
  MLB: ['mlb', 'baseball', 'yankees', 'dodgers', 'red sox'],
  NHL: ['nhl', 'hockey', 'golden knights', 'rangers', 'bruins'],
  SOCCER: ['soccer', 'football', 'mls', 'premier league', 'la galaxy'],
  UFC: ['ufc', 'mma', 'mixed martial arts', 'fight night'],
  F1: ['f1', 'formula 1', 'formula one', 'grand prix'],
  OTHER: ['concert', 'theater', 'comedy', 'wrestling', 'motorsports']
};

/**
 * Extract sport type from Mercury event category or performer name
 */
export function getSportFromMercuryEvent(event: {
  category?: { name?: string };
  performers?: Array<{ name?: string; category?: string }>;
  name?: string;
}): Sport {
  // Combine all searchable text
  const searchText = [
    event.category?.name,
    event.performers?.[0]?.category,
    event.performers?.[0]?.name,
    event.name
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Check each sport's patterns
  for (const [sport, patterns] of Object.entries(SPORT_PATTERNS)) {
    if (patterns.some(pattern => searchText.includes(pattern))) {
      return sport as Sport;
    }
  }

  // Default fallback
  return 'OTHER';
}

/**
 * Get sport display name
 */
export function getSportDisplayName(sport: Sport): string {
  const names: Record<Sport, string> = {
    NFL: 'NFL Football',
    NBA: 'NBA Basketball',
    MLB: 'MLB Baseball',
    NHL: 'NHL Hockey',
    SOCCER: 'Soccer',
    UFC: 'UFC / MMA',
    F1: 'Formula 1',
    OTHER: 'Other Events'
  };
  return names[sport] || sport;
}

/**
 * Check if a sport is a major league
 */
export function isMajorLeagueSport(sport: Sport): boolean {
  return ['NFL', 'NBA', 'MLB', 'NHL'].includes(sport);
}
