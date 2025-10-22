/**
 * Seatics-Mercury Section Mapping Service
 * Maps Mercury ticket inventory to Seatics venue sections
 */

import { getPriceCategory, getPriceCategoryColor } from '@/lib/config/seatics';
import type { MercuryTicket } from '@/lib/api/mercury';
import type { SeaticsSection } from '@/lib/api/seatics';

export interface MappedSection {
  mercurySection: string;
  seaticsId?: string;
  displayName: string;
  ticketCount: number;
  availableQuantities: number[];
  priceRange: {
    min: number;
    max: number;
    avg: number;
  };
  priceCategory: 'budget' | 'standard' | 'premium' | 'vip';
  color: string;
  tickets: MercuryTicket[];
  viewFromSeatUrl?: string;
  isSelected: boolean;
}

export interface VenueMapData {
  sections: MappedSection[];
  priceRange: {
    min: number;
    max: number;
  };
  totalTickets: number;
  selectedSections: Set<string>;
}

export class SeaticsMercuryMapper {
  /**
   * Map Mercury inventory to Seatics sections
   */
  mapInventoryToSections(
    mercuryInventory: MercuryTicket[],
    seaticsSections: SeaticsSection[] = [],
    selectedSections: Set<string> = new Set()
  ): VenueMapData {
    // Group Mercury tickets by section
    const sectionGroups = this.groupTicketsBySection(mercuryInventory);

    // Calculate global price range
    const allPrices = mercuryInventory.map(t => t.price).filter(p => p > 0);
    const globalPriceRange = {
      min: Math.min(...allPrices, 0),
      max: Math.max(...allPrices, 0),
    };

    // Map each section group
    const mappedSections: MappedSection[] = [];

    for (const [sectionName, tickets] of sectionGroups.entries()) {
      // Find matching Seatics section
      const seaticsSection = this.findMatchingSection(sectionName, seaticsSections);

      // Calculate section statistics
      const prices = tickets.map(t => t.price);
      const priceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((a, b) => a + b, 0) / prices.length,
      };

      // Determine price category
      const priceCategory = getPriceCategory(
        priceRange.avg,
        globalPriceRange.min,
        globalPriceRange.max
      );

      // Collect all available quantities
      const availableQuantities = new Set<number>();
      tickets.forEach(ticket => {
        if (ticket.splits) {
          ticket.splits.forEach(q => availableQuantities.add(q));
        } else {
          availableQuantities.add(ticket.quantity);
        }
      });

      mappedSections.push({
        mercurySection: sectionName,
        seaticsId: seaticsSection?.id,
        displayName: this.formatSectionName(sectionName),
        ticketCount: tickets.length,
        availableQuantities: Array.from(availableQuantities).sort((a, b) => a - b),
        priceRange,
        priceCategory,
        color: getPriceCategoryColor(priceCategory),
        tickets,
        viewFromSeatUrl: seaticsSection?.vfsUrl,
        isSelected: selectedSections.size === 0 || selectedSections.has(sectionName),
      });
    }

    // Sort sections by price (lowest to highest)
    mappedSections.sort((a, b) => a.priceRange.avg - b.priceRange.avg);

    return {
      sections: mappedSections,
      priceRange: globalPriceRange,
      totalTickets: mercuryInventory.length,
      selectedSections,
    };
  }

  /**
   * Group tickets by section name
   */
  private groupTicketsBySection(tickets: MercuryTicket[]): Map<string, MercuryTicket[]> {
    const groups = new Map<string, MercuryTicket[]>();

    for (const ticket of tickets) {
      const section = ticket.section || 'General Admission';
      if (!groups.has(section)) {
        groups.set(section, []);
      }
      groups.get(section)!.push(ticket);
    }

    return groups;
  }

  /**
   * Find matching Seatics section for Mercury section name
   * Handles various naming conventions and variations
   */
  private findMatchingSection(
    mercurySection: string,
    seaticsSections: SeaticsSection[]
  ): SeaticsSection | undefined {
    if (seaticsSections.length === 0) return undefined;

    // Normalize the Mercury section name
    const normalized = this.normalizeSection(mercurySection);

    // Try exact match first
    let match = seaticsSections.find(s =>
      this.normalizeSection(s.name) === normalized
    );

    if (match) return match;

    // Try partial matches
    // Remove common prefixes/suffixes
    const cleanedMercury = normalized
      .replace(/^(section|sec|sect)\.?\s*/i, '')
      .replace(/\s*(level|lvl|floor|tier|bowl|deck).*$/i, '');

    match = seaticsSections.find(s => {
      const cleanedSeatics = this.normalizeSection(s.name)
        .replace(/^(section|sec|sect)\.?\s*/i, '')
        .replace(/\s*(level|lvl|floor|tier|bowl|deck).*$/i, '');

      return cleanedSeatics === cleanedMercury;
    });

    return match;
  }

  /**
   * Normalize section names for comparison
   */
  private normalizeSection(section: string): string {
    return section
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ');    // Normalize whitespace
  }

  /**
   * Format section name for display
   */
  private formatSectionName(section: string): string {
    // Handle common patterns
    if (/^\d+$/.test(section)) {
      return `Section ${section}`;
    }

    if (/^[A-Z]$/i.test(section)) {
      return `Section ${section.toUpperCase()}`;
    }

    // Clean up existing "Section" prefix
    if (/^(section|sec|sect)\.?\s+/i.test(section)) {
      const cleaned = section.replace(/^(section|sec|sect)\.?\s+/i, '');
      return `Section ${cleaned}`;
    }

    return section;
  }

  /**
   * Update section selection
   */
  toggleSectionSelection(
    currentData: VenueMapData,
    sectionName: string
  ): Set<string> {
    const newSelection = new Set(currentData.selectedSections);

    if (newSelection.has(sectionName)) {
      newSelection.delete(sectionName);
    } else {
      newSelection.add(sectionName);
    }

    // Update the isSelected flag on sections
    currentData.sections.forEach(section => {
      section.isSelected = newSelection.has(section.mercurySection);
    });

    return newSelection;
  }

  /**
   * Select all sections
   */
  selectAllSections(sections: MappedSection[]): Set<string> {
    return new Set(sections.map(s => s.mercurySection));
  }

  /**
   * Clear all selections
   */
  clearAllSections(): Set<string> {
    return new Set();
  }

  /**
   * Get sections filtered by selection
   */
  getSelectedSections(data: VenueMapData): MappedSection[] {
    return data.sections.filter(s => s.isSelected);
  }

  /**
   * Calculate statistics for selected sections
   */
  getSelectionStats(data: VenueMapData) {
    const selected = this.getSelectedSections(data);

    if (selected.length === 0) {
      return {
        sectionCount: 0,
        ticketCount: 0,
        priceRange: { min: 0, max: 0, avg: 0 },
      };
    }

    const allTickets = selected.flatMap(s => s.tickets);
    const prices = allTickets.map(t => t.price);

    return {
      sectionCount: selected.length,
      ticketCount: allTickets.length,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((a, b) => a + b, 0) / prices.length,
      },
    };
  }

  /**
   * Format tickets for Seatics map display
   */
  formatTicketsForSeatics(data: VenueMapData): any[] {
    const formattedTickets: any[] = [];

    data.sections.forEach(section => {
      if (!section.isSelected) return;

      section.tickets.forEach(ticket => {
        formattedTickets.push({
          tgUserSec: ticket.section,
          tgUserRow: ticket.row || '',
          tgUserSeats: ticket.seatNumbers?.join('-') || '',
          tgQty: ticket.quantity,
          tgPrice: ticket.price,
          tgID: ticket.id,
          tgType: 1, // Event ticket
          tgNotes: ticket.notes,
          tgDeliveryOptions: ticket.deliveryMethod,
          // Visual properties for map
          tgColor: section.color,
          tgSelected: section.isSelected,
        });
      });
    });

    return formattedTickets;
  }
}

// Export singleton instance
export const seaticsMercuryMapper = new SeaticsMercuryMapper();