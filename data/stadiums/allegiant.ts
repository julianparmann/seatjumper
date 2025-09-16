export interface StadiumSection {
  id: string;
  level: 'lower' | 'middle' | 'upper';
  x: number;
  y: number;
  width: number;
  height: number;
  rows: string[];
  priceRange: { min: number; max: number };
  color: string;
  angle?: number; // For curved positioning
  isClub?: boolean; // For club sections
}

// Generate sections using polar coordinates for realistic stadium bowl shape
const generateStadiumSections = (): StadiumSection[] => {
  const sections: StadiumSection[] = [];
  const stadiumCenter = { x: 200, y: 200 };
  const fieldWidth = 120;
  const fieldHeight = 60;

  // 100 Level - Lower Bowl (101-144)
  const lowerRadius = 90;
  const lowerSections = [
    // Sideline sections (better seats)
    ...Array.from({ length: 22 }, (_, i) => {
      const sectionNum = 101 + i;
      const angle = (i * 16.36) * (Math.PI / 180); // 360/22 = 16.36 degrees per section
      const x = stadiumCenter.x + Math.cos(angle) * lowerRadius - 15;
      const y = stadiumCenter.y + Math.sin(angle) * lowerRadius - 12;

      // Club sections C109-C115 and C131-C137 (premium sideline)
      const isClubSection = (sectionNum >= 109 && sectionNum <= 115) || (sectionNum >= 131 && sectionNum <= 137);
      const id = isClubSection ? `C${sectionNum}` : sectionNum.toString();
      const color = isClubSection ? '#dc2626' : '#fbbf24'; // Red for club, gold for regular
      const priceRange = isClubSection
        ? { min: 600, max: 1200 }
        : sectionNum >= 109 && sectionNum <= 137
          ? { min: 400, max: 800 } // Sideline premium
          : { min: 250, max: 500 }; // End zones

      return {
        id,
        level: 'lower' as const,
        x,
        y,
        width: 30,
        height: 25,
        rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
        priceRange,
        color,
        angle,
        isClub: isClubSection
      };
    }),
    // Additional sections to reach 144
    ...Array.from({ length: 22 }, (_, i) => {
      const sectionNum = 123 + i;
      const angle = ((i + 22) * 16.36) * (Math.PI / 180);
      const x = stadiumCenter.x + Math.cos(angle) * lowerRadius - 15;
      const y = stadiumCenter.y + Math.sin(angle) * lowerRadius - 12;

      const isClubSection = (sectionNum >= 131 && sectionNum <= 137);
      const id = isClubSection ? `C${sectionNum}` : sectionNum.toString();
      const color = isClubSection ? '#dc2626' : '#fbbf24';
      const priceRange = isClubSection
        ? { min: 600, max: 1200 }
        : sectionNum >= 131 && sectionNum <= 137
          ? { min: 400, max: 800 }
          : { min: 250, max: 500 };

      return {
        id,
        level: 'lower' as const,
        x,
        y,
        width: 30,
        height: 25,
        rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
        priceRange,
        color,
        angle,
        isClub: isClubSection
      };
    })
  ];

  // 200 Level - Club/Suite Level
  const middleRadius = 70;
  const middleSections = Array.from({ length: 32 }, (_, i) => {
    const sectionNum = 201 + i;
    const angle = (i * 11.25) * (Math.PI / 180); // 360/32 = 11.25 degrees per section
    const x = stadiumCenter.x + Math.cos(angle) * middleRadius - 12;
    const y = stadiumCenter.y + Math.sin(angle) * middleRadius - 10;

    const priceRange = sectionNum >= 209 && sectionNum <= 225
      ? { min: 350, max: 600 } // Premium sideline
      : { min: 200, max: 400 }; // End zones and corners

    return {
      id: sectionNum.toString(),
      level: 'middle' as const,
      x,
      y,
      width: 25,
      height: 20,
      rows: ['A', 'B', 'C', 'D', 'E', 'F'],
      priceRange,
      color: '#3b82f6',
      angle
    };
  });

  // 300 Level - Upper Deck
  const upperRadius = 50;
  const upperSections = Array.from({ length: 40 }, (_, i) => {
    const sectionNum = 301 + i;
    const angle = (i * 9) * (Math.PI / 180); // 360/40 = 9 degrees per section
    const x = stadiumCenter.x + Math.cos(angle) * upperRadius - 10;
    const y = stadiumCenter.y + Math.sin(angle) * upperRadius - 8;

    const priceRange = sectionNum >= 315 && sectionNum <= 325
      ? { min: 120, max: 250 } // Premium sideline
      : { min: 60, max: 150 }; // End zones and corners

    return {
      id: sectionNum.toString(),
      level: 'upper' as const,
      x,
      y,
      width: 20,
      height: 15,
      rows: ['A', 'B', 'C', 'D', 'E'],
      priceRange,
      color: '#6b7280',
      angle
    };
  });

  return [...lowerSections, ...middleSections, ...upperSections];
};

export const allegiantStadiumSections: StadiumSection[] = generateStadiumSections();

export function getSectionByNumber(sectionNumber: string): StadiumSection | undefined {
  return allegiantStadiumSections.find(s => s.id === sectionNumber);
}

export function getSectionsByLevel(level: 'lower' | 'middle' | 'upper'): StadiumSection[] {
  return allegiantStadiumSections.filter(s => s.level === level);
}

export function getRandomSection(): StadiumSection {
  return allegiantStadiumSections[Math.floor(Math.random() * allegiantStadiumSections.length)];
}