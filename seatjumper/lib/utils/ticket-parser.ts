export interface ParsedTicket {
  section: string;
  row: string;
  seats?: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  isDiscounted: boolean;
  attributes: string[];
  seatViewUrl?: string;
  rawText: string;
}

import { TierLevel } from '@prisma/client';

export interface TicketGroupInput {
  id: string;
  section: string;
  row: string;
  quantity: number;
  pricePerSeat: number;
  seatViewUrl?: string;
  notes?: string;
  availableUnits?: number[];
  tierLevel?: TierLevel;
  tierPriority?: number;
}

export interface ParsedTicketWithImage extends ParsedTicket {
  imageUrl?: string;
  imageIndex?: number;
}

// Parse ticket data into individual tickets
export function parseTicketData(rawData: string): ParsedTicket[] {
  const tickets: ParsedTicket[] = [];

  // Split by double newlines or certain keywords to separate ticket blocks
  const blocks = rawData.split(/\n\s*\n|(?=Section\s+[A-Z0-9]+|Cheapest|Best deal|Viewed)/g);

  let currentTicket: Partial<ParsedTicket> | null = null;

  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l);

    if (lines.length === 0) continue;

    // Look for section pattern
    const sectionMatch = block.match(/Section\s+([A-Z]?\d+[A-Z]?)/);
    if (sectionMatch) {
      // Save previous ticket if exists
      if (currentTicket && currentTicket.section && currentTicket.price) {
        tickets.push(completeTicket(currentTicket));
      }

      // Start new ticket
      currentTicket = {
        section: sectionMatch[1],
        attributes: [],
        rawText: block
      };

      // Extract row
      const rowMatch = block.match(/Row\s+([A-Z0-9]+)/);
      if (rowMatch) {
        currentTicket.row = rowMatch[1];
      }

      // Extract seats if available
      const seatsMatch = block.match(/Seats?\s+([\d\s\-,]+)/);
      if (seatsMatch) {
        currentTicket.seats = seatsMatch[1];
      }

      // Extract quantity
      const qtyMatch = block.match(/(\d+)\s+tickets?\s+together/);
      currentTicket.quantity = qtyMatch ? parseInt(qtyMatch[1]) : 2; // Default to 2

      // Extract price (handle both regular and discounted)
      const discountedMatch = block.match(/Now\s*\$?([\d,]+)\s*(?:incl\.|including)?\s*fees?/);
      const regularMatch = block.match(/\$?([\d,]+)\s*(?:incl\.|including)?\s*fees?/);
      const originalMatch = block.match(/\$?([\d,]+)\s*(?=Now)/);

      if (discountedMatch) {
        currentTicket.price = parseFloat(discountedMatch[1].replace(/,/g, ''));
        currentTicket.isDiscounted = true;
        if (originalMatch) {
          currentTicket.originalPrice = parseFloat(originalMatch[1].replace(/,/g, ''));
        }
      } else if (regularMatch) {
        currentTicket.price = parseFloat(regularMatch[1].replace(/,/g, ''));
        currentTicket.isDiscounted = false;
      }

      // Extract attributes
      const attributes = [];
      if (/clear view/i.test(block)) attributes.push('Clear View');
      if (/front row/i.test(block)) attributes.push('Front Row');
      if (/aisle seat/i.test(block)) attributes.push('Aisle Seat');
      if (/instant download/i.test(block)) attributes.push('Instant Download');
      if (/vip/i.test(block)) attributes.push('VIP');
      if (/club/i.test(block) && !currentTicket.section?.startsWith('C')) attributes.push('Club Access');
      if (/only \d+ left/i.test(block)) attributes.push('Limited Availability');
      if (/view from seat/i.test(block)) currentTicket.seatViewUrl = 'placeholder'; // Would need actual URL

      currentTicket.attributes = attributes;
    }
  }

  // Don't forget the last ticket
  if (currentTicket && currentTicket.section && currentTicket.price) {
    tickets.push(completeTicket(currentTicket));
  }

  return tickets;
}

function completeTicket(partial: Partial<ParsedTicket>): ParsedTicket {
  return {
    section: partial.section || '',
    row: partial.row || '1',
    seats: partial.seats,
    quantity: partial.quantity || 2,
    price: partial.price || 0,
    originalPrice: partial.originalPrice,
    isDiscounted: partial.isDiscounted || false,
    attributes: partial.attributes || [],
    seatViewUrl: partial.seatViewUrl,
    rawText: partial.rawText || ''
  };
}

import { classifyTicketTier } from './ticket-classifier';

// Convert parsed tickets to individual TicketGroup inputs
export function generateTicketGroupInputs(tickets: ParsedTicket[], imageUrls?: string[]): TicketGroupInput[] {
  return tickets.map((ticket, idx) => {
      // Determine availableUnits based on quantity
    // STRICT matching: tickets are ONLY available for their exact quantity bundles
    let availableUnits: number[] = [];

    switch(ticket.quantity) {
      case 1:
        availableUnits = [1]; // Only available for 1x bundles
        break;
      case 2:
        availableUnits = [2]; // Only available for 2x bundles (keeps pairs together)
        break;
      case 3:
        availableUnits = [3]; // Only available for 3x bundles
        break;
      case 4:
        availableUnits = [4]; // Only available for 4x bundles
        break;
      default:
        // For quantities > 4, make available for all bundle sizes up to the quantity
        availableUnits = [1, 2, 3, 4].filter(size => size <= ticket.quantity);
        break;
    }

    // Use provided image URL if available, otherwise fall back to parsed URL
    const seatViewUrl = imageUrls?.[idx] || ticket.seatViewUrl;

    // Auto-classify tier based on price
    const tierClassification = classifyTicketTier(ticket.price);

    return {
      id: `bulk-${idx}-${Date.now()}`,
      section: ticket.section,
      row: ticket.row,
      quantity: ticket.quantity,
      pricePerSeat: ticket.price,
      seatViewUrl,
      notes: ticket.attributes.join(', ') || undefined,
      availableUnits,
      tierLevel: tierClassification.tierLevel,
      tierPriority: tierClassification.tierPriority
    };
  });
}

// Group tickets by level for preview display
export function groupTicketsForPreview(tickets: ParsedTicket[]): Map<string, ParsedTicket[]> {
  const grouped = new Map<string, ParsedTicket[]>();

  for (const ticket of tickets) {
    const levelKey = detectLevel(ticket.section);
    if (!grouped.has(levelKey)) {
      grouped.set(levelKey, []);
    }
    grouped.get(levelKey)!.push(ticket);
  }

  return grouped;
}

function detectLevel(section: string): string {
  // Club sections (C131, C136, etc.)
  if (section.startsWith('C')) return 'Club/Premium';

  // VIP/Suite sections (W2070, etc.)
  if (section.startsWith('W')) return 'VIP/Suite';

  // Floor sections
  if (section.toLowerCase().includes('floor')) return 'Floor/Field';

  // Numeric sections - group by hundreds
  const numMatch = section.match(/^(\d)/);
  if (numMatch) {
    const firstDigit = numMatch[0];
    switch(firstDigit) {
      case '1': return '100s - Lower Bowl';
      case '2': return '200s - Club Level';
      case '3': return '300s - Mezzanine';
      case '4': return '400s - Upper Deck';
      default: return `${firstDigit}00s`;
    }
  }

  return section;
}

// Calculate statistics for preview
export function calculateStats(tickets: ParsedTicket[]): {
  totalTickets: number;
  totalSeats: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  uniqueSections: number;
} {
  if (tickets.length === 0) {
    return {
      totalTickets: 0,
      totalSeats: 0,
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      uniqueSections: 0
    };
  }

  const sections = new Set<string>();
  let totalSeats = 0;
  let totalValue = 0;
  let minPrice = Infinity;
  let maxPrice = 0;

  for (const ticket of tickets) {
    sections.add(ticket.section);
    totalSeats += ticket.quantity;
    totalValue += ticket.price * ticket.quantity;
    minPrice = Math.min(minPrice, ticket.price);
    maxPrice = Math.max(maxPrice, ticket.price);
  }

  return {
    totalTickets: tickets.length,
    totalSeats,
    avgPrice: Math.round(totalValue / totalSeats),
    minPrice,
    maxPrice,
    uniqueSections: sections.size
  };
}

// Format price for display
export function formatPrice(price: number): string {
  return `$${price.toFixed(0)}`;
}

// Validate parsed data
export function validateParsedTickets(tickets: ParsedTicket[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (tickets.length === 0) {
    errors.push('No valid tickets found in the data');
  }

  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];

    if (!ticket.section) {
      errors.push(`Ticket #${i + 1} missing section number`);
    }
    if (ticket.price <= 0) {
      errors.push(`Invalid price for ${ticket.section ? `section ${ticket.section}` : `ticket #${i + 1}`}`);
    }
    if (ticket.quantity <= 0) {
      errors.push(`Invalid quantity for ${ticket.section ? `section ${ticket.section}` : `ticket #${i + 1}`}`);
    }
    if (!ticket.row) {
      warnings.push(`${ticket.section ? `Section ${ticket.section}` : `Ticket #${i + 1}`} missing row number (defaulted to Row 1)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}