export interface SectionCoordinate {
  id: string;
  x: number;  // percentage from left (0-100)
  y: number;  // percentage from top (0-100)
  level: 'lower' | 'middle' | 'upper';
  isClub?: boolean;
  rows?: string[];
  priceRange?: { min: number; max: number };
}

// Precise coordinates for Allegiant Stadium sections
// Based on actual stadium seating chart layout
export const allegiantPreciseSections: SectionCoordinate[] = [
  // Lower Bowl - 100 Level (Inner Ring)
  // Start from top (north) and go clockwise
  { id: '143', x: 50, y: 25, level: 'lower' },
  { id: '144', x: 54, y: 26, level: 'lower' },
  { id: '145', x: 58, y: 28, level: 'lower' },
  { id: '146', x: 61, y: 30, level: 'lower' },
  { id: '101', x: 64, y: 33, level: 'lower' },
  { id: '102', x: 66, y: 36, level: 'lower' },
  { id: '103', x: 68, y: 39, level: 'lower' },
  { id: '104', x: 69, y: 42, level: 'lower' },
  { id: '105', x: 70, y: 45, level: 'lower' },
  { id: '106', x: 70, y: 48, level: 'lower' },
  { id: '107', x: 70, y: 51, level: 'lower' },
  { id: '108', x: 70, y: 54, level: 'lower' },
  { id: '109', x: 69, y: 57, level: 'lower' },
  { id: '110', x: 68, y: 60, level: 'lower' },
  { id: '111', x: 66, y: 63, level: 'lower' },
  { id: '112', x: 64, y: 66, level: 'lower' },
  { id: '113', x: 61, y: 69, level: 'lower' },
  { id: '114', x: 58, y: 71, level: 'lower' },
  { id: '115', x: 54, y: 73, level: 'lower' },
  { id: '116', x: 50, y: 74, level: 'lower' },
  { id: '117', x: 46, y: 73, level: 'lower' },
  { id: '118', x: 42, y: 71, level: 'lower' },
  { id: '119', x: 39, y: 69, level: 'lower' },
  { id: '120', x: 36, y: 66, level: 'lower' },
  { id: '121', x: 34, y: 63, level: 'lower' },
  { id: '122', x: 32, y: 60, level: 'lower' },
  { id: '123', x: 31, y: 57, level: 'lower' },
  { id: '124', x: 30, y: 54, level: 'lower' },
  { id: '125', x: 30, y: 51, level: 'lower' },
  { id: '126', x: 30, y: 48, level: 'lower' },
  { id: '127', x: 30, y: 45, level: 'lower' },
  { id: '128', x: 31, y: 42, level: 'lower' },
  { id: '129', x: 32, y: 39, level: 'lower' },
  { id: '130', x: 34, y: 36, level: 'lower' },
  { id: '131', x: 36, y: 33, level: 'lower' },
  { id: '132', x: 39, y: 30, level: 'lower' },
  { id: '133', x: 42, y: 28, level: 'lower' },
  { id: '134', x: 46, y: 26, level: 'lower' },

  // Club Level - 200 Level (Middle Ring)
  // Positioned slightly outside the lower bowl
  { id: '243', x: 50, y: 20, level: 'middle', isClub: true },
  { id: '244', x: 55, y: 21, level: 'middle', isClub: true },
  { id: '245', x: 60, y: 23, level: 'middle', isClub: true },
  { id: '246', x: 64, y: 26, level: 'middle', isClub: true },
  { id: '201', x: 68, y: 29, level: 'middle', isClub: true },
  { id: '202', x: 71, y: 33, level: 'middle', isClub: true },
  { id: '203', x: 73, y: 37, level: 'middle', isClub: true },
  { id: '204', x: 74, y: 41, level: 'middle', isClub: true },
  { id: '205', x: 75, y: 45, level: 'middle', isClub: true },
  { id: '206', x: 75, y: 49, level: 'middle', isClub: true },
  { id: '207', x: 75, y: 53, level: 'middle', isClub: true },
  { id: '208', x: 74, y: 57, level: 'middle', isClub: true },
  { id: '209', x: 73, y: 61, level: 'middle', isClub: true },
  { id: '210', x: 71, y: 65, level: 'middle', isClub: true },
  { id: '211', x: 68, y: 69, level: 'middle', isClub: true },
  { id: '212', x: 64, y: 72, level: 'middle', isClub: true },
  { id: '213', x: 60, y: 75, level: 'middle', isClub: true },
  { id: '214', x: 55, y: 77, level: 'middle', isClub: true },
  { id: '215', x: 50, y: 78, level: 'middle', isClub: true },
  { id: '216', x: 45, y: 77, level: 'middle', isClub: true },
  { id: '217', x: 40, y: 75, level: 'middle', isClub: true },
  { id: '218', x: 36, y: 72, level: 'middle', isClub: true },
  { id: '219', x: 32, y: 69, level: 'middle', isClub: true },
  { id: '220', x: 29, y: 65, level: 'middle', isClub: true },
  { id: '221', x: 27, y: 61, level: 'middle', isClub: true },
  { id: '222', x: 26, y: 57, level: 'middle', isClub: true },
  { id: '223', x: 25, y: 53, level: 'middle', isClub: true },
  { id: '224', x: 25, y: 49, level: 'middle', isClub: true },
  { id: '225', x: 25, y: 45, level: 'middle', isClub: true },
  { id: '226', x: 26, y: 41, level: 'middle', isClub: true },
  { id: '227', x: 27, y: 37, level: 'middle', isClub: true },
  { id: '228', x: 29, y: 33, level: 'middle', isClub: true },
  { id: '229', x: 32, y: 29, level: 'middle', isClub: true },
  { id: '230', x: 36, y: 26, level: 'middle', isClub: true },
  { id: '231', x: 40, y: 23, level: 'middle', isClub: true },
  { id: '232', x: 45, y: 21, level: 'middle', isClub: true },

  // Upper Deck - 300 Level (Outer Ring)
  // Positioned on the outermost ring
  { id: '343', x: 50, y: 15, level: 'upper' },
  { id: '344', x: 56, y: 16, level: 'upper' },
  { id: '345', x: 61, y: 18, level: 'upper' },
  { id: '346', x: 66, y: 21, level: 'upper' },
  { id: '301', x: 70, y: 24, level: 'upper' },
  { id: '302', x: 74, y: 28, level: 'upper' },
  { id: '303', x: 77, y: 32, level: 'upper' },
  { id: '304', x: 79, y: 36, level: 'upper' },
  { id: '305', x: 80, y: 41, level: 'upper' },
  { id: '306', x: 81, y: 45, level: 'upper' },
  { id: '307', x: 81, y: 50, level: 'upper' },
  { id: '308', x: 81, y: 54, level: 'upper' },
  { id: '309', x: 80, y: 59, level: 'upper' },
  { id: '310', x: 79, y: 63, level: 'upper' },
  { id: '311', x: 77, y: 67, level: 'upper' },
  { id: '312', x: 74, y: 71, level: 'upper' },
  { id: '313', x: 70, y: 75, level: 'upper' },
  { id: '314', x: 66, y: 78, level: 'upper' },
  { id: '315', x: 61, y: 80, level: 'upper' },
  { id: '316', x: 56, y: 82, level: 'upper' },
  { id: '317', x: 50, y: 83, level: 'upper' },
  { id: '318', x: 44, y: 82, level: 'upper' },
  { id: '319', x: 39, y: 80, level: 'upper' },
  { id: '320', x: 34, y: 78, level: 'upper' },
  { id: '321', x: 30, y: 75, level: 'upper' },
  { id: '322', x: 26, y: 71, level: 'upper' },
  { id: '323', x: 23, y: 67, level: 'upper' },
  { id: '324', x: 21, y: 63, level: 'upper' },
  { id: '325', x: 20, y: 59, level: 'upper' },
  { id: '326', x: 19, y: 54, level: 'upper' },
  { id: '327', x: 19, y: 50, level: 'upper' },
  { id: '328', x: 19, y: 45, level: 'upper' },
  { id: '329', x: 20, y: 41, level: 'upper' },
  { id: '330', x: 21, y: 36, level: 'upper' },
  { id: '331', x: 23, y: 32, level: 'upper' },
  { id: '332', x: 26, y: 28, level: 'upper' },
  { id: '333', x: 30, y: 24, level: 'upper' },
  { id: '334', x: 34, y: 21, level: 'upper' },
  { id: '335', x: 39, y: 18, level: 'upper' },
  { id: '336', x: 44, y: 16, level: 'upper' },

  // Upper Deck - 400 Level (Far corners)
  { id: '401', x: 75, y: 20, level: 'upper' },
  { id: '402', x: 82, y: 25, level: 'upper' },
  { id: '403', x: 85, y: 32, level: 'upper' },
  { id: '404', x: 87, y: 40, level: 'upper' },
  { id: '405', x: 87, y: 48, level: 'upper' },
  { id: '406', x: 87, y: 56, level: 'upper' },
  { id: '407', x: 85, y: 64, level: 'upper' },
  { id: '408', x: 82, y: 72, level: 'upper' },
  { id: '409', x: 75, y: 79, level: 'upper' },
  { id: '410', x: 67, y: 84, level: 'upper' },
  { id: '411', x: 58, y: 87, level: 'upper' },
  { id: '412', x: 50, y: 88, level: 'upper' },
  { id: '413', x: 42, y: 87, level: 'upper' },
  { id: '414', x: 33, y: 84, level: 'upper' },
  { id: '415', x: 25, y: 79, level: 'upper' },
  { id: '416', x: 18, y: 72, level: 'upper' },
  { id: '417', x: 15, y: 64, level: 'upper' },
  { id: '418', x: 13, y: 56, level: 'upper' },
  { id: '419', x: 13, y: 48, level: 'upper' },
  { id: '420', x: 13, y: 40, level: 'upper' },
  { id: '421', x: 15, y: 32, level: 'upper' },
  { id: '422', x: 18, y: 25, level: 'upper' },
  { id: '423', x: 25, y: 20, level: 'upper' },
];

// Add pricing and row information
export function enrichSectionData(section: SectionCoordinate): SectionCoordinate {
  const enriched = { ...section };

  // Add rows based on level
  if (section.level === 'lower') {
    enriched.rows = Array.from({ length: 30 }, (_, i) => (i + 1).toString());
    enriched.priceRange = { min: 150, max: 500 };
  } else if (section.level === 'middle') {
    enriched.rows = Array.from({ length: 20 }, (_, i) => (i + 1).toString());
    enriched.priceRange = { min: 200, max: 800 };
  } else {
    enriched.rows = Array.from({ length: 25 }, (_, i) => (i + 1).toString());
    enriched.priceRange = { min: 50, max: 200 };
  }

  return enriched;
}

// Helper functions
export const getSectionById = (id: string): SectionCoordinate | undefined => {
  const section = allegiantPreciseSections.find(s => s.id === id);
  return section ? enrichSectionData(section) : undefined;
};

export const getRandomSection = (): SectionCoordinate => {
  const randomIndex = Math.floor(Math.random() * allegiantPreciseSections.length);
  return enrichSectionData(allegiantPreciseSections[randomIndex]);
};

export const getSectionsByLevel = (level: 'lower' | 'middle' | 'upper'): SectionCoordinate[] => {
  return allegiantPreciseSections
    .filter(s => s.level === level)
    .map(enrichSectionData);
};