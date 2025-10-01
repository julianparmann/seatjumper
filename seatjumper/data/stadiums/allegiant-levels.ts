// Stadium level definitions for level-based inventory system
// Instead of individual sections, we define broader zones

export interface StadiumLevel {
  id: string;
  displayName: string;
  level: string; // lower, middle, upper, field
  zones: {
    x: number; // percentage position (0-100)
    y: number; // percentage position (0-100)
    label?: string; // optional label like "Endzone", "Midfield", etc.
  }[];
  color: string; // color for highlighting
  glowColor: string; // glow effect color
}

// Allegiant Stadium levels for football configuration
export const allegiantFootballLevels: StadiumLevel[] = [
  {
    id: 'field',
    displayName: 'Field Level',
    level: 'field',
    zones: [
      { x: 50, y: 50, label: 'Midfield' },
      { x: 30, y: 50, label: 'West 20' },
      { x: 70, y: 50, label: 'East 20' },
      { x: 20, y: 50, label: 'West Endzone' },
      { x: 80, y: 50, label: 'East Endzone' }
    ],
    color: '#fbbf24', // yellow
    glowColor: '#fbbf24'
  },
  {
    id: 'lower',
    displayName: 'Lower Bowl',
    level: 'lower',
    zones: [
      // Lower bowl corners and sides
      { x: 15, y: 35 }, // NW
      { x: 85, y: 35 }, // NE
      { x: 15, y: 65 }, // SW
      { x: 85, y: 65 }, // SE
      { x: 50, y: 25 }, // North
      { x: 50, y: 75 }, // South
      { x: 10, y: 50 }, // West
      { x: 90, y: 50 }  // East
    ],
    color: '#60a5fa', // blue
    glowColor: '#3b82f6'
  },
  {
    id: 'club',
    displayName: 'Club Level',
    level: 'middle',
    zones: [
      // Club level sections
      { x: 20, y: 30 },
      { x: 80, y: 30 },
      { x: 20, y: 70 },
      { x: 80, y: 70 },
      { x: 50, y: 20 },
      { x: 50, y: 80 }
    ],
    color: '#a78bfa', // purple
    glowColor: '#8b5cf6'
  },
  {
    id: 'upper',
    displayName: 'Upper Deck',
    level: 'upper',
    zones: [
      // Upper deck sections
      { x: 25, y: 25 },
      { x: 75, y: 25 },
      { x: 25, y: 75 },
      { x: 75, y: 75 },
      { x: 50, y: 15 },
      { x: 50, y: 85 },
      { x: 5, y: 50 },
      { x: 95, y: 50 }
    ],
    color: '#ef4444', // red
    glowColor: '#dc2626'
  }
];

// Concert configuration with floor sections
export const allegiantConcertLevels: StadiumLevel[] = [
  {
    id: 'floor',
    displayName: 'Floor/Pit',
    level: 'floor',
    zones: [
      { x: 50, y: 45, label: 'FLOOR A' },
      { x: 40, y: 50, label: 'FLOOR B' },
      { x: 60, y: 50, label: 'FLOOR C' },
      { x: 50, y: 55, label: 'FLOOR D' }
    ],
    color: '#fbbf24',
    glowColor: '#f59e0b'
  },
  ...allegiantFootballLevels.filter(l => l.id !== 'field') // Include other levels
];

// Helper function to get level by ID
export function getLevelById(levelId: string, isConcert = false): StadiumLevel | undefined {
  const levels = isConcert ? allegiantConcertLevels : allegiantFootballLevels;
  return levels.find(l => l.id === levelId || l.level === levelId);
}

// Get a random zone from all levels
export function getRandomZone(isConcert = false): { level: StadiumLevel; zone: any; index: number } {
  const levels = isConcert ? allegiantConcertLevels : allegiantFootballLevels;
  const allZones: { level: StadiumLevel; zone: any; index: number }[] = [];

  levels.forEach(level => {
    level.zones.forEach((zone, index) => {
      allZones.push({ level, zone, index });
    });
  });

  return allZones[Math.floor(Math.random() * allZones.length)];
}