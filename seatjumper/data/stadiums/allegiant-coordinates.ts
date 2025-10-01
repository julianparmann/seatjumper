export interface SectionCoordinate {
  id: string;
  x: number;  // Percentage from left
  y: number;  // Percentage from top
  level: 'lower' | 'middle' | 'upper';
  isClub?: boolean;
  rows?: string[];
  priceRange?: { min: number; max: number };
}

// Precise coordinate mapping for Allegiant Stadium sections
// Based on actual stadium photo at /public/images/stadiums/allegiant-stadium.png
// Coordinates are in percentage of image dimensions for responsive scaling
export const allegiantStadiumCoordinates: SectionCoordinate[] = [
  // LOWER BOWL (100 Level) - Inner ring closest to field
  // Left side (101-108)
  { id: '101', x: 20, y: 58, level: 'lower' },
  { id: '102', x: 23, y: 52, level: 'lower' },
  { id: '103', x: 26, y: 47, level: 'lower' },
  { id: '104', x: 30, y: 43, level: 'lower' },
  { id: '105', x: 34, y: 40, level: 'lower' },
  { id: '106', x: 38, y: 37, level: 'lower' },
  { id: '107', x: 43, y: 35, level: 'lower' },
  { id: '108', x: 48, y: 34, level: 'lower' },

  // Top side (109-122)
  { id: 'C109', x: 53, y: 34, level: 'lower', isClub: true },
  { id: 'C110', x: 58, y: 35, level: 'lower', isClub: true },
  { id: 'C111', x: 62, y: 37, level: 'lower', isClub: true },
  { id: 'C112', x: 66, y: 40, level: 'lower', isClub: true },
  { id: 'C113', x: 70, y: 43, level: 'lower', isClub: true },
  { id: 'C114', x: 74, y: 47, level: 'lower', isClub: true },
  { id: 'C115', x: 77, y: 52, level: 'lower', isClub: true },
  { id: '116', x: 80, y: 58, level: 'lower' },
  { id: '117', x: 80, y: 64, level: 'lower' },
  { id: '118', x: 78, y: 70, level: 'lower' },
  { id: '119', x: 75, y: 75, level: 'lower' },
  { id: '120', x: 71, y: 79, level: 'lower' },
  { id: '121', x: 66, y: 82, level: 'lower' },
  { id: '122', x: 61, y: 84, level: 'lower' },

  // Right side (123-130)
  { id: '123', x: 56, y: 85, level: 'lower' },
  { id: '124', x: 50, y: 85, level: 'lower' },
  { id: '125', x: 44, y: 85, level: 'lower' },
  { id: '126', x: 39, y: 84, level: 'lower' },
  { id: '127', x: 34, y: 82, level: 'lower' },
  { id: '128', x: 29, y: 79, level: 'lower' },
  { id: '129', x: 25, y: 75, level: 'lower' },
  { id: '130', x: 22, y: 70, level: 'lower' },

  // Bottom side (131-144)
  { id: 'C131', x: 20, y: 64, level: 'lower', isClub: true },
  { id: 'C132', x: 23, y: 58, level: 'lower', isClub: true },
  { id: 'C133', x: 26, y: 53, level: 'lower', isClub: true },
  { id: 'C134', x: 30, y: 49, level: 'lower', isClub: true },
  { id: 'C135', x: 34, y: 46, level: 'lower', isClub: true },
  { id: 'C136', x: 38, y: 43, level: 'lower', isClub: true },
  { id: 'C137', x: 43, y: 41, level: 'lower', isClub: true },
  { id: '138', x: 48, y: 40, level: 'lower' },
  { id: '139', x: 53, y: 40, level: 'lower' },
  { id: '140', x: 58, y: 41, level: 'lower' },
  { id: '141', x: 62, y: 43, level: 'lower' },
  { id: '142', x: 66, y: 46, level: 'lower' },
  { id: '143', x: 70, y: 49, level: 'lower' },
  { id: '144', x: 74, y: 53, level: 'lower' },

  // MIDDLE BOWL (200 Level) - Middle ring
  // Left side sections (201-208)
  { id: '201', x: 15, y: 60, level: 'middle' },
  { id: '202', x: 17, y: 54, level: 'middle' },
  { id: '203', x: 20, y: 48, level: 'middle' },
  { id: '204', x: 23, y: 43, level: 'middle' },
  { id: '205', x: 27, y: 38, level: 'middle' },
  { id: '206', x: 31, y: 34, level: 'middle' },
  { id: '207', x: 36, y: 31, level: 'middle' },
  { id: '208', x: 41, y: 28, level: 'middle' },

  // Top sections (209-224)
  { id: '209', x: 46, y: 27, level: 'middle' },
  { id: '210', x: 51, y: 26, level: 'middle' },
  { id: '211', x: 56, y: 27, level: 'middle' },
  { id: '212', x: 61, y: 28, level: 'middle' },
  { id: '213', x: 65, y: 31, level: 'middle' },
  { id: '214', x: 69, y: 34, level: 'middle' },
  { id: '215', x: 73, y: 38, level: 'middle' },
  { id: '216', x: 77, y: 43, level: 'middle' },
  { id: '217', x: 80, y: 48, level: 'middle' },
  { id: '218', x: 83, y: 54, level: 'middle' },
  { id: '219', x: 85, y: 60, level: 'middle' },
  { id: '220', x: 85, y: 66, level: 'middle' },
  { id: '221', x: 83, y: 72, level: 'middle' },
  { id: '222', x: 80, y: 77, level: 'middle' },
  { id: '223', x: 77, y: 82, level: 'middle' },
  { id: '224', x: 73, y: 86, level: 'middle' },

  // Right sections (225-232)
  { id: '225', x: 69, y: 89, level: 'middle' },
  { id: '226', x: 64, y: 91, level: 'middle' },
  { id: '227', x: 59, y: 92, level: 'middle' },
  { id: '228', x: 54, y: 93, level: 'middle' },
  { id: '229', x: 49, y: 93, level: 'middle' },
  { id: '230', x: 44, y: 92, level: 'middle' },
  { id: '231', x: 39, y: 91, level: 'middle' },
  { id: '232', x: 34, y: 89, level: 'middle' },

  // Bottom sections (233-247)
  { id: '233', x: 30, y: 86, level: 'middle' },
  { id: '234', x: 26, y: 82, level: 'middle' },
  { id: '235', x: 23, y: 77, level: 'middle' },
  { id: '236', x: 20, y: 72, level: 'middle' },
  { id: '237', x: 17, y: 66, level: 'middle' },
  { id: '238', x: 15, y: 60, level: 'middle' },
  { id: '239', x: 17, y: 54, level: 'middle' },
  { id: '240', x: 20, y: 48, level: 'middle' },
  { id: '241', x: 23, y: 43, level: 'middle' },
  { id: '242', x: 27, y: 38, level: 'middle' },
  { id: '243', x: 31, y: 34, level: 'middle' },
  { id: '244', x: 36, y: 31, level: 'middle' },
  { id: '245', x: 41, y: 28, level: 'middle' },
  { id: '246', x: 46, y: 27, level: 'middle' },
  { id: '247', x: 51, y: 26, level: 'middle' },

  // UPPER BOWL (300-400 Level) - Outer ring
  // 300 Level - Upper sections left side
  { id: '301', x: 10, y: 62, level: 'upper' },
  { id: '302', x: 11, y: 56, level: 'upper' },
  { id: '303', x: 13, y: 50, level: 'upper' },
  { id: '304', x: 15, y: 44, level: 'upper' },
  { id: '305', x: 18, y: 39, level: 'upper' },
  { id: '306', x: 21, y: 34, level: 'upper' },
  { id: '307', x: 25, y: 30, level: 'upper' },
  { id: '308', x: 29, y: 26, level: 'upper' },
  { id: '309', x: 34, y: 23, level: 'upper' },
  { id: '310', x: 39, y: 21, level: 'upper' },
  { id: '311', x: 44, y: 19, level: 'upper' },
  { id: '312', x: 49, y: 18, level: 'upper' },
  { id: '313', x: 54, y: 18, level: 'upper' },
  { id: '314', x: 59, y: 19, level: 'upper' },
  { id: '315', x: 64, y: 21, level: 'upper' },
  { id: '316', x: 68, y: 23, level: 'upper' },
  { id: '317', x: 72, y: 26, level: 'upper' },
  { id: '318', x: 76, y: 30, level: 'upper' },
  { id: '319', x: 79, y: 34, level: 'upper' },
  { id: '320', x: 82, y: 39, level: 'upper' },
  { id: '321', x: 85, y: 44, level: 'upper' },
  { id: '322', x: 87, y: 50, level: 'upper' },
  { id: '323', x: 89, y: 56, level: 'upper' },
  { id: '324', x: 90, y: 62, level: 'upper' },
  { id: '325', x: 90, y: 68, level: 'upper' },
  { id: '326', x: 89, y: 74, level: 'upper' },
  { id: '327', x: 87, y: 79, level: 'upper' },
  { id: '328', x: 85, y: 84, level: 'upper' },
  { id: '329', x: 82, y: 88, level: 'upper' },
  { id: '330', x: 79, y: 91, level: 'upper' },
  { id: '331', x: 75, y: 94, level: 'upper' },
  { id: '332', x: 71, y: 96, level: 'upper' },
  { id: '333', x: 66, y: 97, level: 'upper' },
  { id: '334', x: 61, y: 98, level: 'upper' },
  { id: '335', x: 56, y: 98, level: 'upper' },
  { id: '336', x: 51, y: 98, level: 'upper' },
  { id: '337', x: 46, y: 98, level: 'upper' },
  { id: '338', x: 41, y: 97, level: 'upper' },
  { id: '339', x: 36, y: 96, level: 'upper' },
  { id: '340', x: 32, y: 94, level: 'upper' },
  { id: '341', x: 28, y: 91, level: 'upper' },
  { id: '342', x: 24, y: 88, level: 'upper' },
  { id: '343', x: 21, y: 84, level: 'upper' },
  { id: '344', x: 18, y: 79, level: 'upper' },

  // 400 Level sections (if visible)
  { id: '401', x: 15, y: 74, level: 'upper' },
  { id: '402', x: 13, y: 68, level: 'upper' },
  { id: '403', x: 11, y: 62, level: 'upper' },
  { id: '404', x: 10, y: 56, level: 'upper' },
  { id: '405', x: 11, y: 50, level: 'upper' },
  { id: '406', x: 13, y: 44, level: 'upper' },
  { id: '407', x: 15, y: 39, level: 'upper' },
  { id: '408', x: 18, y: 34, level: 'upper' },
  { id: '409', x: 21, y: 30, level: 'upper' },
  { id: '410', x: 25, y: 26, level: 'upper' },
  { id: '411', x: 29, y: 23, level: 'upper' },
  { id: '412', x: 34, y: 21, level: 'upper' },
  { id: '413', x: 39, y: 19, level: 'upper' },
  { id: '414', x: 44, y: 18, level: 'upper' },
  { id: '415', x: 49, y: 17, level: 'upper' },
  { id: '416', x: 54, y: 17, level: 'upper' },
  { id: '417', x: 59, y: 18, level: 'upper' },
  { id: '418', x: 64, y: 19, level: 'upper' },
  { id: '419', x: 68, y: 21, level: 'upper' },
  { id: '420', x: 72, y: 23, level: 'upper' },
  { id: '421', x: 76, y: 26, level: 'upper' },
  { id: '422', x: 79, y: 30, level: 'upper' },
  { id: '423', x: 82, y: 34, level: 'upper' },
  { id: '424', x: 85, y: 39, level: 'upper' },
  { id: '425', x: 87, y: 44, level: 'upper' },
  { id: '426', x: 89, y: 50, level: 'upper' },
  { id: '427', x: 90, y: 56, level: 'upper' },
  { id: '428', x: 90, y: 62, level: 'upper' },
  { id: '429', x: 89, y: 68, level: 'upper' },
  { id: '430', x: 87, y: 74, level: 'upper' },
  { id: '431', x: 85, y: 79, level: 'upper' },
  { id: '432', x: 82, y: 84, level: 'upper' },
  { id: '433', x: 79, y: 88, level: 'upper' },
  { id: '434', x: 75, y: 91, level: 'upper' },
  { id: '435', x: 71, y: 94, level: 'upper' },
  { id: '436', x: 66, y: 96, level: 'upper' },
  { id: '437', x: 61, y: 97, level: 'upper' },
  { id: '438', x: 56, y: 98, level: 'upper' },
  { id: '439', x: 51, y: 98, level: 'upper' },
  { id: '440', x: 46, y: 98, level: 'upper' },
  { id: '441', x: 41, y: 97, level: 'upper' },
  { id: '442', x: 36, y: 96, level: 'upper' },
  { id: '443', x: 32, y: 94, level: 'upper' },
  { id: '444', x: 28, y: 91, level: 'upper' },
];

// Add row and pricing information to sections
export const enrichSectionData = (section: SectionCoordinate): SectionCoordinate => {
  const baseSection = { ...section };

  // Add rows based on level
  if (section.level === 'lower') {
    baseSection.rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
    if (section.isClub) {
      baseSection.priceRange = { min: 600, max: 1200 };
    } else {
      baseSection.priceRange = { min: 250, max: 500 };
    }
  } else if (section.level === 'middle') {
    baseSection.rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    baseSection.priceRange = { min: 200, max: 400 };
  } else {
    baseSection.rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    baseSection.priceRange = { min: 60, max: 150 };
  }

  return baseSection;
};

// Get section by ID
export const getSectionById = (id: string): SectionCoordinate | undefined => {
  const section = allegiantStadiumCoordinates.find(s => s.id === id);
  return section ? enrichSectionData(section) : undefined;
};

// Get random section for animation
export const getRandomSection = (): SectionCoordinate => {
  const randomIndex = Math.floor(Math.random() * allegiantStadiumCoordinates.length);
  return enrichSectionData(allegiantStadiumCoordinates[randomIndex]);
};

// Get sections by level
export const getSectionsByLevel = (level: 'lower' | 'middle' | 'upper'): SectionCoordinate[] => {
  return allegiantStadiumCoordinates
    .filter(s => s.level === level)
    .map(enrichSectionData);
};

// Stadium configuration for database
export const allegiantStadiumConfig = {
  name: 'allegiant-stadium',
  displayName: 'Allegiant Stadium',
  city: 'Las Vegas',
  state: 'Nevada',
  imagePath: '/images/stadiums/allegiant-stadium.png',
  imageWidth: 1600,  // Actual image dimensions
  imageHeight: 900,
  sections: allegiantStadiumCoordinates.map(enrichSectionData),
};