/**
 * Seatics Maps API Client
 * Handles authentication and communication with TicketNetwork's Seatics service
 */

import { seaticsConfig, getSeaticsApiUrl } from '@/lib/config/seatics';
import { mercuryTokenService } from '@/lib/services/mercury-token-service';

// Types for Seatics API responses
export interface SeaticsEventInfo {
  id: string;
  name: string;
  venue: string;
  mapName: string;
  mapImage: string;
  date: string;
  hasInteractiveMap: boolean;
}

export interface SeaticsMapData {
  levels: any[];
  sections: any[];
  geometry: any;
  viewBox: string;
}

export interface SeaticsSection {
  id: string;
  name: string;
  level: string;
  capacity?: number;
  vfsUrl?: string; // View from Seat URL
  geometry?: any;
}

export interface SeaticsVenueResponse {
  eventInfo: SeaticsEventInfo;
  mapData?: SeaticsMapData;
  sections?: SeaticsSection[];
}

// Note: Seatics uses the same OAuth credentials as Mercury
// We'll reuse the Mercury token service for consistency

export class SeaticsAPI {
  private baseUrl: string;
  private vfsUrl: string;

  constructor() {
    this.baseUrl = getSeaticsApiUrl();
    this.vfsUrl = seaticsConfig.api.sandbox.vfsUrl;

    console.log('[Seatics API] Initialized:', {
      baseUrl: this.baseUrl,
      sandbox: seaticsConfig.isSandbox,
    });
  }

  /**
   * Get event and venue map information
   * This is the main entry point for fetching Seatics map data
   */
  async getEventAndVenueInfo(params: {
    eventId?: string;
    eventName?: string;
    venue?: string;
    dateTime: string;
  }): Promise<SeaticsVenueResponse | null> {
    try {
      // For Mercury events, we may need to map the event ID
      // or use event name + venue for matching
      const queryParams = new URLSearchParams({
        websiteConfigId: seaticsConfig.credentials.websiteConfigId,
        consumerKey: seaticsConfig.credentials.consumerKey || 'demo_key',
        dateTime: params.dateTime,
      });

      if (params.eventId) {
        queryParams.append('eventId', params.eventId);
      } else {
        if (params.eventName) queryParams.append('eventName', params.eventName);
        if (params.venue) queryParams.append('venue', params.venue);
      }

      // Note: Seatics API uses JSONP for browser calls
      // In Next.js API routes, we'll make direct HTTP calls
      const url = `${this.baseUrl}/EventAndVenueInfo?${queryParams.toString()}`;

      console.log('[Seatics API] Fetching venue info:', url);

      // Get OAuth token if needed (may not be required for Maps API)
      // const token = await mercuryTokenService.getToken();

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          // 'Authorization': `Bearer ${token}`, // May not be needed for Maps
        },
      });

      if (!response.ok) {
        console.error('[Seatics API] Error response:', response.status);
        return null;
      }

      const data = await response.json();
      return this.transformResponse(data);

    } catch (error) {
      console.error('[Seatics API] Request failed:', error);
      return null;
    }
  }

  /**
   * Get "View from Seat" image URL for a section
   */
  getViewFromSeatUrl(section: string, row?: string): string {
    // Construct VFS URL based on section and optional row
    const baseUrl = this.vfsUrl;
    const params = new URLSearchParams({
      section,
      ...(row && { row }),
    });

    return `${baseUrl}/image?${params.toString()}`;
  }

  /**
   * Transform Seatics response to our format
   */
  private transformResponse(data: any): SeaticsVenueResponse {
    // Seatics returns an array: [eventInfo, mapData]
    const [eventInfo, mapData] = Array.isArray(data) ? data : [data.eventInfo, data.mapData];

    return {
      eventInfo: {
        id: eventInfo?.id || '',
        name: eventInfo?.name || '',
        venue: eventInfo?.venue || '',
        mapName: eventInfo?.mapName || '',
        mapImage: eventInfo?.mapImage || '',
        date: eventInfo?.date || '',
        hasInteractiveMap: !!mapData,
      },
      mapData,
      sections: this.extractSections(mapData),
    };
  }

  /**
   * Extract section information from map data
   */
  private extractSections(mapData: any): SeaticsSection[] {
    if (!mapData || !mapData.sections) return [];

    return mapData.sections.map((section: any) => ({
      id: section.id,
      name: section.name,
      level: section.level,
      capacity: section.capacity,
      vfsUrl: section.vfsUrl,
      geometry: section.geometry,
    }));
  }

  /**
   * Get mock data for development
   */
  getMockVenueData(): SeaticsVenueResponse {
    return {
      eventInfo: {
        id: 'mock-event-1',
        name: 'Mock Event',
        venue: 'Mock Arena',
        mapName: 'Mock Arena Map',
        mapImage: 'https://example.com/mock-map.svg',
        date: '2025-02-01',
        hasInteractiveMap: true,
      },
      mapData: {
        levels: [
          { id: 'level-1', name: 'Lower Bowl', color: '#4ade80' },
          { id: 'level-2', name: 'Upper Bowl', color: '#fbbf24' },
        ],
        sections: [],
        geometry: {},
        viewBox: '0 0 1000 1000',
      },
      sections: [
        { id: 'sec-101', name: '101', level: 'level-1' },
        { id: 'sec-102', name: '102', level: 'level-1' },
        { id: 'sec-201', name: '201', level: 'level-2' },
        { id: 'sec-202', name: '202', level: 'level-2' },
      ],
    };
  }
}

// Export singleton instance
export const seaticsAPI = new SeaticsAPI();

/**
 * Helper to format Mercury ticket data for Seatics map display
 */
export function formatMercuryTicketsForSeatics(mercuryTickets: any[]): any[] {
  return mercuryTickets.map(ticket => ({
    tgUserSec: ticket.section || 'General',
    tgUserRow: ticket.row || '',
    tgUserSeats: ticket.seatNumbers?.join('-') || '',
    tgQty: ticket.quantity || 0,
    tgPrice: ticket.price || 0,
    tgID: ticket.id,
    tgType: 1, // Event ticket
    tgNotes: ticket.notes,
    tgDeliveryOptions: ticket.deliveryMethod,
    // Additional fields for Seatics
    tgMark: 0, // Featured inventory flag
    tgCType: 'R', // Real inventory (not zone)
  }));
}