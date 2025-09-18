import { SectionCoordinate } from './allegiant-precise-coordinates';

// Concert configuration for Allegiant Stadium
// Inherits all regular stadium sections plus floor/stage sections
export const allegiantConcertSections: SectionCoordinate[] = [
  // === FLOOR SECTIONS (Concert Floor with Main Stage and Circle Stage) ===
  // MAIN STAGE is at the North end (top of stadium)

  // FLOOR A Sections - Premium front sections flanking the walking ramp
  { id: 'FLOOR A2', x: 45, y: 40, level: 'lower', priceRange: { min: 429, max: 529 } }, // Left of ramp
  { id: 'FLOOR A3', x: 55, y: 40, level: 'lower', priceRange: { min: 429, max: 529 } }, // Right of ramp

  // FLOOR A Additional Sections - Front center
  { id: 'FLOOR A1', x: 40, y: 42, level: 'lower', priceRange: { min: 399, max: 449 } },
  { id: 'FLOOR A4', x: 50, y: 42, level: 'lower', priceRange: { min: 399, max: 449 } },
  { id: 'FLOOR A5', x: 60, y: 42, level: 'lower', priceRange: { min: 399, max: 449 } },

  // FLOOR B Sections - Second tier
  { id: 'FLOOR B1', x: 38, y: 46, level: 'lower', priceRange: { min: 349, max: 399 } },
  { id: 'FLOOR B2', x: 44, y: 46, level: 'lower', priceRange: { min: 349, max: 399 } },
  { id: 'FLOOR B3', x: 50, y: 46, level: 'lower', priceRange: { min: 349, max: 399 } },
  { id: 'FLOOR B4', x: 56, y: 46, level: 'lower', priceRange: { min: 349, max: 399 } },
  { id: 'FLOOR B5', x: 62, y: 46, level: 'lower', priceRange: { min: 349, max: 399 } },

  // Circle Stage Area (Center of Floor)
  { id: 'FLOOR C1', x: 45, y: 50, level: 'lower', priceRange: { min: 329, max: 379 } }, // Around circle stage
  { id: 'FLOOR C2', x: 50, y: 50, level: 'lower', priceRange: { min: 329, max: 379 } }, // Center - circle stage
  { id: 'FLOOR C3', x: 55, y: 50, level: 'lower', priceRange: { min: 329, max: 379 } }, // Around circle stage

  // FLOOR D Sections - Behind circle stage
  { id: 'FLOOR D1', x: 40, y: 54, level: 'lower', priceRange: { min: 219, max: 269 } },
  { id: 'FLOOR D2', x: 46, y: 54, level: 'lower', priceRange: { min: 219, max: 269 } },
  { id: 'FLOOR D3', x: 50, y: 54, level: 'lower', priceRange: { min: 219, max: 269 } },
  { id: 'FLOOR D4', x: 54, y: 54, level: 'lower', priceRange: { min: 219, max: 269 } },
  { id: 'FLOOR D5', x: 60, y: 54, level: 'lower', priceRange: { min: 219, max: 269 } },

  // FLOOR E Sections - Back floor sections
  { id: 'FLOOR E1', x: 42, y: 58, level: 'lower', priceRange: { min: 179, max: 229 } },
  { id: 'FLOOR E2', x: 47, y: 58, level: 'lower', priceRange: { min: 179, max: 229 } },
  { id: 'FLOOR E3', x: 53, y: 58, level: 'lower', priceRange: { min: 179, max: 229 } },
  { id: 'FLOOR E4', x: 58, y: 58, level: 'lower', priceRange: { min: 179, max: 229 } },

  // === LOWER BOWL - 100 LEVEL ===
  // Start from top (north) and go clockwise
  { id: '143', x: 50, y: 25, level: 'lower', priceRange: { min: 99, max: 149 } },
  { id: '144', x: 54, y: 26, level: 'lower', priceRange: { min: 99, max: 149 } },
  { id: '145', x: 58, y: 28, level: 'lower', priceRange: { min: 119, max: 169 } },
  { id: '146', x: 61, y: 30, level: 'lower', priceRange: { min: 119, max: 169 } },
  { id: '101', x: 64, y: 33, level: 'lower', priceRange: { min: 139, max: 189 } },
  { id: '102', x: 66, y: 36, level: 'lower', priceRange: { min: 139, max: 189 } },
  { id: '103', x: 68, y: 39, level: 'lower', priceRange: { min: 159, max: 209 } },
  { id: '104', x: 69, y: 42, level: 'lower', priceRange: { min: 159, max: 209 } },
  { id: '105', x: 70, y: 45, level: 'lower', priceRange: { min: 179, max: 229 } },
  { id: '106', x: 70, y: 48, level: 'lower', priceRange: { min: 179, max: 229 } },
  { id: '107', x: 70, y: 51, level: 'lower', priceRange: { min: 179, max: 229 } },
  { id: '108', x: 70, y: 54, level: 'lower', priceRange: { min: 179, max: 229 } },
  { id: '109', x: 69, y: 57, level: 'lower', priceRange: { min: 159, max: 209 } },
  { id: '110', x: 68, y: 60, level: 'lower', priceRange: { min: 159, max: 209 } },
  { id: '111', x: 66, y: 63, level: 'lower', priceRange: { min: 139, max: 189 } },
  { id: '112', x: 64, y: 66, level: 'lower', priceRange: { min: 139, max: 189 } },
  { id: '113', x: 61, y: 69, level: 'lower', priceRange: { min: 119, max: 169 } },
  { id: '114', x: 58, y: 71, level: 'lower', priceRange: { min: 119, max: 169 } },
  { id: '115', x: 54, y: 73, level: 'lower', priceRange: { min: 99, max: 149 } },
  { id: '116', x: 50, y: 74, level: 'lower', priceRange: { min: 99, max: 149 } },
  { id: '117', x: 46, y: 73, level: 'lower', priceRange: { min: 99, max: 149 } },
  { id: '118', x: 42, y: 71, level: 'lower', priceRange: { min: 119, max: 169 } },
  { id: '119', x: 39, y: 69, level: 'lower', priceRange: { min: 119, max: 169 } },
  { id: '120', x: 36, y: 66, level: 'lower', priceRange: { min: 139, max: 189 } },
  { id: '121', x: 34, y: 63, level: 'lower', priceRange: { min: 139, max: 189 } },
  { id: '122', x: 32, y: 60, level: 'lower', priceRange: { min: 159, max: 209 } },
  { id: '123', x: 31, y: 57, level: 'lower', priceRange: { min: 159, max: 209 } },
  { id: '124', x: 30, y: 54, level: 'lower', priceRange: { min: 179, max: 229 } },
  { id: '125', x: 30, y: 51, level: 'lower', priceRange: { min: 179, max: 229 } },
  { id: '126', x: 30, y: 48, level: 'lower', priceRange: { min: 179, max: 229 } },
  { id: '127', x: 30, y: 45, level: 'lower', priceRange: { min: 179, max: 229 } },
  { id: '128', x: 31, y: 42, level: 'lower', priceRange: { min: 159, max: 209 } },
  { id: '129', x: 32, y: 39, level: 'lower', priceRange: { min: 159, max: 209 } },
  { id: '130', x: 34, y: 36, level: 'lower', priceRange: { min: 139, max: 189 } },
  { id: '131', x: 36, y: 33, level: 'lower', priceRange: { min: 139, max: 189 } },
  { id: '132', x: 39, y: 30, level: 'lower', priceRange: { min: 119, max: 169 } },
  { id: '133', x: 42, y: 28, level: 'lower', priceRange: { min: 119, max: 169 } },
  { id: '134', x: 46, y: 26, level: 'lower', priceRange: { min: 99, max: 149 } },

  // === CLUB LEVEL - 200 LEVEL ===
  // These are premium sections with club access
  // East Side Club Sections
  { id: 'C201', x: 75, y: 35, level: 'middle', isClub: true, priceRange: { min: 199, max: 299 } },
  { id: 'C202', x: 76, y: 40, level: 'middle', isClub: true, priceRange: { min: 199, max: 299 } },
  { id: 'C203', x: 77, y: 45, level: 'middle', isClub: true, priceRange: { min: 219, max: 319 } },
  { id: 'C204', x: 77, y: 50, level: 'middle', isClub: true, priceRange: { min: 219, max: 319 } },
  { id: 'C205', x: 77, y: 55, level: 'middle', isClub: true, priceRange: { min: 219, max: 319 } },
  { id: 'C206', x: 76, y: 60, level: 'middle', isClub: true, priceRange: { min: 199, max: 299 } },
  { id: 'C207', x: 75, y: 65, level: 'middle', isClub: true, priceRange: { min: 199, max: 299 } },

  // West Side Club Sections
  { id: 'C224', x: 25, y: 35, level: 'middle', isClub: true, priceRange: { min: 199, max: 299 } },
  { id: 'C225', x: 24, y: 40, level: 'middle', isClub: true, priceRange: { min: 199, max: 299 } },
  { id: 'C226', x: 23, y: 45, level: 'middle', isClub: true, priceRange: { min: 219, max: 319 } },
  { id: 'C227', x: 23, y: 50, level: 'middle', isClub: true, priceRange: { min: 219, max: 319 } },
  { id: 'C228', x: 23, y: 55, level: 'middle', isClub: true, priceRange: { min: 219, max: 319 } },
  { id: 'C229', x: 24, y: 60, level: 'middle', isClub: true, priceRange: { min: 199, max: 299 } },
  { id: 'C230', x: 25, y: 65, level: 'middle', isClub: true, priceRange: { min: 199, max: 299 } },

  // Regular 200 Level Sections
  { id: '243', x: 50, y: 20, level: 'middle', priceRange: { min: 79, max: 129 } },
  { id: '244', x: 55, y: 21, level: 'middle', priceRange: { min: 79, max: 129 } },
  { id: '245', x: 60, y: 23, level: 'middle', priceRange: { min: 89, max: 139 } },
  { id: '246', x: 65, y: 26, level: 'middle', priceRange: { min: 89, max: 139 } },
  { id: '201', x: 69, y: 29, level: 'middle', priceRange: { min: 99, max: 149 } },
  { id: '202', x: 72, y: 32, level: 'middle', priceRange: { min: 99, max: 149 } },
  { id: '203', x: 74, y: 36, level: 'middle', priceRange: { min: 109, max: 159 } },
  { id: '204', x: 76, y: 40, level: 'middle', priceRange: { min: 109, max: 159 } },
  { id: '205', x: 77, y: 44, level: 'middle', priceRange: { min: 119, max: 169 } },
  { id: '206', x: 78, y: 48, level: 'middle', priceRange: { min: 119, max: 169 } },
  { id: '207', x: 78, y: 52, level: 'middle', priceRange: { min: 119, max: 169 } },
  { id: '208', x: 77, y: 56, level: 'middle', priceRange: { min: 119, max: 169 } },
  { id: '209', x: 76, y: 60, level: 'middle', priceRange: { min: 109, max: 159 } },
  { id: '210', x: 74, y: 64, level: 'middle', priceRange: { min: 109, max: 159 } },
  { id: '211', x: 72, y: 68, level: 'middle', priceRange: { min: 99, max: 149 } },
  { id: '212', x: 69, y: 71, level: 'middle', priceRange: { min: 99, max: 149 } },
  { id: '213', x: 65, y: 74, level: 'middle', priceRange: { min: 89, max: 139 } },
  { id: '214', x: 60, y: 77, level: 'middle', priceRange: { min: 89, max: 139 } },
  { id: '215', x: 55, y: 79, level: 'middle', priceRange: { min: 79, max: 129 } },
  { id: '216', x: 50, y: 80, level: 'middle', priceRange: { min: 79, max: 129 } },
  { id: '217', x: 45, y: 79, level: 'middle', priceRange: { min: 79, max: 129 } },
  { id: '218', x: 40, y: 77, level: 'middle', priceRange: { min: 89, max: 139 } },
  { id: '219', x: 35, y: 74, level: 'middle', priceRange: { min: 89, max: 139 } },
  { id: '220', x: 31, y: 71, level: 'middle', priceRange: { min: 99, max: 149 } },
  { id: '221', x: 28, y: 68, level: 'middle', priceRange: { min: 99, max: 149 } },
  { id: '222', x: 26, y: 64, level: 'middle', priceRange: { min: 109, max: 159 } },
  { id: '223', x: 24, y: 60, level: 'middle', priceRange: { min: 109, max: 159 } },
  { id: '224', x: 23, y: 56, level: 'middle', priceRange: { min: 119, max: 169 } },
  { id: '225', x: 22, y: 52, level: 'middle', priceRange: { min: 119, max: 169 } },
  { id: '226', x: 22, y: 48, level: 'middle', priceRange: { min: 119, max: 169 } },
  { id: '227', x: 23, y: 44, level: 'middle', priceRange: { min: 119, max: 169 } },
  { id: '228', x: 24, y: 40, level: 'middle', priceRange: { min: 109, max: 159 } },
  { id: '229', x: 26, y: 36, level: 'middle', priceRange: { min: 109, max: 159 } },
  { id: '230', x: 28, y: 32, level: 'middle', priceRange: { min: 99, max: 149 } },
  { id: '231', x: 31, y: 29, level: 'middle', priceRange: { min: 99, max: 149 } },
  { id: '232', x: 35, y: 26, level: 'middle', priceRange: { min: 89, max: 139 } },
  { id: '233', x: 40, y: 23, level: 'middle', priceRange: { min: 89, max: 139 } },
  { id: '234', x: 45, y: 21, level: 'middle', priceRange: { min: 79, max: 129 } },

  // === UPPER DECK - 300/400 LEVEL ===
  // 300 Level (Outer Ring)
  { id: '343', x: 50, y: 15, level: 'upper', priceRange: { min: 49, max: 79 } },
  { id: '344', x: 56, y: 16, level: 'upper', priceRange: { min: 49, max: 79 } },
  { id: '345', x: 62, y: 18, level: 'upper', priceRange: { min: 59, max: 89 } },
  { id: '346', x: 67, y: 21, level: 'upper', priceRange: { min: 59, max: 89 } },
  { id: '301', x: 72, y: 24, level: 'upper', priceRange: { min: 69, max: 99 } },
  { id: '302', x: 76, y: 28, level: 'upper', priceRange: { min: 69, max: 99 } },
  { id: '303', x: 79, y: 32, level: 'upper', priceRange: { min: 69, max: 99 } },
  { id: '304', x: 81, y: 36, level: 'upper', priceRange: { min: 69, max: 99 } },
  { id: '305', x: 83, y: 40, level: 'upper', priceRange: { min: 79, max: 109 } },
  { id: '306', x: 84, y: 44, level: 'upper', priceRange: { min: 79, max: 109 } },
  { id: '307', x: 85, y: 48, level: 'upper', priceRange: { min: 79, max: 109 } },
  { id: '308', x: 85, y: 52, level: 'upper', priceRange: { min: 79, max: 109 } },
  { id: '309', x: 84, y: 56, level: 'upper', priceRange: { min: 79, max: 109 } },
  { id: '310', x: 83, y: 60, level: 'upper', priceRange: { min: 69, max: 99 } },
  { id: '311', x: 81, y: 64, level: 'upper', priceRange: { min: 69, max: 99 } },
  { id: '312', x: 79, y: 68, level: 'upper', priceRange: { min: 69, max: 99 } },
  { id: '313', x: 76, y: 72, level: 'upper', priceRange: { min: 69, max: 99 } },
  { id: '314', x: 72, y: 76, level: 'upper', priceRange: { min: 59, max: 89 } },
  { id: '315', x: 67, y: 79, level: 'upper', priceRange: { min: 59, max: 89 } },
  { id: '316', x: 62, y: 82, level: 'upper', priceRange: { min: 49, max: 79 } },
  { id: '317', x: 56, y: 84, level: 'upper', priceRange: { min: 49, max: 79 } },
  { id: '318', x: 50, y: 85, level: 'upper', priceRange: { min: 49, max: 79 } },
  { id: '319', x: 44, y: 84, level: 'upper', priceRange: { min: 49, max: 79 } },
  { id: '320', x: 38, y: 82, level: 'upper', priceRange: { min: 49, max: 79 } },
  { id: '321', x: 33, y: 79, level: 'upper', priceRange: { min: 59, max: 89 } },
  { id: '322', x: 28, y: 76, level: 'upper', priceRange: { min: 59, max: 89 } },
  { id: '323', x: 24, y: 72, level: 'upper', priceRange: { min: 69, max: 99 } },
  { id: '324', x: 21, y: 68, level: 'upper', priceRange: { min: 69, max: 99 } },
  { id: '325', x: 19, y: 64, level: 'upper', priceRange: { min: 69, max: 99 } },
  { id: '326', x: 17, y: 60, level: 'upper', priceRange: { min: 69, max: 99 } },
  { id: '327', x: 16, y: 56, level: 'upper', priceRange: { min: 79, max: 109 } },
  { id: '328', x: 15, y: 52, level: 'upper', priceRange: { min: 79, max: 109 } },
  { id: '329', x: 15, y: 48, level: 'upper', priceRange: { min: 79, max: 109 } },
  { id: '330', x: 16, y: 44, level: 'upper', priceRange: { min: 79, max: 109 } },
  { id: '331', x: 17, y: 40, level: 'upper', priceRange: { min: 79, max: 109 } },
  { id: '332', x: 19, y: 36, level: 'upper', priceRange: { min: 69, max: 99 } },
  { id: '333', x: 21, y: 32, level: 'upper', priceRange: { min: 69, max: 99 } },
  { id: '334', x: 24, y: 28, level: 'upper', priceRange: { min: 69, max: 99 } },
  { id: '335', x: 28, y: 24, level: 'upper', priceRange: { min: 69, max: 99 } },
  { id: '336', x: 33, y: 21, level: 'upper', priceRange: { min: 59, max: 89 } },
  { id: '337', x: 38, y: 18, level: 'upper', priceRange: { min: 59, max: 89 } },
  { id: '338', x: 44, y: 16, level: 'upper', priceRange: { min: 49, max: 79 } },

  // 400 Level (Top Ring)
  { id: '443', x: 50, y: 10, level: 'upper', priceRange: { min: 39, max: 59 } },
  { id: '444', x: 57, y: 11, level: 'upper', priceRange: { min: 39, max: 59 } },
  { id: '445', x: 64, y: 13, level: 'upper', priceRange: { min: 39, max: 59 } },
  { id: '446', x: 70, y: 16, level: 'upper', priceRange: { min: 39, max: 59 } },
  { id: '401', x: 75, y: 19, level: 'upper', priceRange: { min: 49, max: 69 } },
  { id: '402', x: 80, y: 23, level: 'upper', priceRange: { min: 49, max: 69 } },
  { id: '403', x: 83, y: 27, level: 'upper', priceRange: { min: 49, max: 69 } },
  { id: '404', x: 86, y: 31, level: 'upper', priceRange: { min: 49, max: 69 } },
  { id: '405', x: 88, y: 36, level: 'upper', priceRange: { min: 59, max: 79 } },
  { id: '406', x: 89, y: 41, level: 'upper', priceRange: { min: 59, max: 79 } },
  { id: '407', x: 90, y: 46, level: 'upper', priceRange: { min: 59, max: 79 } },
  { id: '408', x: 90, y: 50, level: 'upper', priceRange: { min: 59, max: 79 } },
  { id: '409', x: 90, y: 54, level: 'upper', priceRange: { min: 59, max: 79 } },
  { id: '410', x: 89, y: 59, level: 'upper', priceRange: { min: 59, max: 79 } },
  { id: '411', x: 88, y: 64, level: 'upper', priceRange: { min: 49, max: 69 } },
  { id: '412', x: 86, y: 69, level: 'upper', priceRange: { min: 49, max: 69 } },
  { id: '413', x: 83, y: 73, level: 'upper', priceRange: { min: 49, max: 69 } },
  { id: '414', x: 80, y: 77, level: 'upper', priceRange: { min: 49, max: 69 } },
  { id: '415', x: 75, y: 81, level: 'upper', priceRange: { min: 39, max: 59 } },
  { id: '416', x: 70, y: 84, level: 'upper', priceRange: { min: 39, max: 59 } },
  { id: '417', x: 64, y: 87, level: 'upper', priceRange: { min: 39, max: 59 } },
  { id: '418', x: 57, y: 89, level: 'upper', priceRange: { min: 39, max: 59 } },
  { id: '419', x: 50, y: 90, level: 'upper', priceRange: { min: 39, max: 59 } },
  { id: '420', x: 43, y: 89, level: 'upper', priceRange: { min: 39, max: 59 } },
  { id: '421', x: 36, y: 87, level: 'upper', priceRange: { min: 39, max: 59 } },
  { id: '422', x: 30, y: 84, level: 'upper', priceRange: { min: 39, max: 59 } },
  { id: '423', x: 25, y: 81, level: 'upper', priceRange: { min: 39, max: 59 } },
  { id: '424', x: 20, y: 77, level: 'upper', priceRange: { min: 49, max: 69 } },
  { id: '425', x: 17, y: 73, level: 'upper', priceRange: { min: 49, max: 69 } },
  { id: '426', x: 14, y: 69, level: 'upper', priceRange: { min: 49, max: 69 } },
  { id: '427', x: 12, y: 64, level: 'upper', priceRange: { min: 49, max: 69 } },
  { id: '428', x: 11, y: 59, level: 'upper', priceRange: { min: 59, max: 79 } },
  { id: '429', x: 10, y: 54, level: 'upper', priceRange: { min: 59, max: 79 } },
  { id: '430', x: 10, y: 50, level: 'upper', priceRange: { min: 59, max: 79 } },
  { id: '431', x: 10, y: 46, level: 'upper', priceRange: { min: 59, max: 79 } },
  { id: '432', x: 11, y: 41, level: 'upper', priceRange: { min: 59, max: 79 } },
  { id: '433', x: 12, y: 36, level: 'upper', priceRange: { min: 49, max: 69 } },
  { id: '434', x: 14, y: 31, level: 'upper', priceRange: { min: 49, max: 69 } },
  { id: '435', x: 17, y: 27, level: 'upper', priceRange: { min: 49, max: 69 } },
  { id: '436', x: 20, y: 23, level: 'upper', priceRange: { min: 49, max: 69 } },
  { id: '437', x: 25, y: 19, level: 'upper', priceRange: { min: 39, max: 59 } },
  { id: '438', x: 30, y: 16, level: 'upper', priceRange: { min: 39, max: 59 } },
  { id: '439', x: 36, y: 13, level: 'upper', priceRange: { min: 39, max: 59 } },
  { id: '440', x: 43, y: 11, level: 'upper', priceRange: { min: 39, max: 59 } },
];

// Helper function to get section by ID
export function getConcertSection(sectionId: string): SectionCoordinate | undefined {
  return allegiantConcertSections.find(section => section.id === sectionId);
}

// Helper function to get sections by level
export function getConcertSectionsByLevel(level: 'lower' | 'middle' | 'upper'): SectionCoordinate[] {
  return allegiantConcertSections.filter(section => section.level === level);
}

// Helper function to get floor sections only
export function getFloorSections(): SectionCoordinate[] {
  return allegiantConcertSections.filter(section => section.id.startsWith('FLOOR'));
}