// TickPick Internal API Client
// Based on discovered internal endpoints

interface TickPickListing {
  id: string;
  section: string;
  row: string;
  price: number;
  quantity: number;
  seats?: string[];
  notes?: string;
}

interface TickPickEvent {
  id: number;
  name: string;
  venue: string;
  datetime: string;
  listings?: TickPickListing[];
}

export class TickPickInternalAPI {
  private baseUrl = 'https://api.tickpick.com/1.0';

  // Extract event ID from TickPick URL
  extractEventId(url: string): string | null {
    // URL format: https://www.tickpick.com/buy-event-name/EVENT_ID/
    const match = url.match(/\/(\d+)\/?(?:\?|$)/);
    return match ? match[1] : null;
  }

  // Get event listings using internal API
  async getEventListings(eventId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/listings/internal/event/${eventId}?mid=${eventId}`;


      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      });

      if (!response.ok) {
        throw new Error(`TickPick API returned ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('TickPick internal API error:', error);
      throw error;
    }
  }

  // Parse listings from API response
  parseListings(data: any): TickPickListing[] {
    const listings: TickPickListing[] = [];

    // The response structure may vary, try different paths
    const ticketData = data.listings || data.results || data.tickets || data;

    if (Array.isArray(ticketData)) {
      for (const item of ticketData) {
        listings.push({
          id: item.id || item.listing_id || String(Math.random()),
          section: item.section || item.s || 'Unknown',
          row: item.row || item.r || 'GA',
          price: parseFloat(item.price || item.p || 0),
          quantity: parseInt(item.quantity || item.q || item.splits?.[0] || 2),
          seats: item.seats || [],
          notes: item.notes || item.n
        });
      }
    }

    return listings;
  }

  // Get event details from search
  async searchEvent(query: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/search/events?q=${encodeURIComponent(query)}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }
}

// Helper function to get tickets from a TickPick URL
export async function getTicketsFromUrl(tickpickUrl: string) {
  const api = new TickPickInternalAPI();

  // Extract event ID from URL
  const eventId = api.extractEventId(tickpickUrl);

  if (!eventId) {
    throw new Error('Could not extract event ID from URL');
  }


  // Get listings from internal API
  const data = await api.getEventListings(eventId);

  // Parse the listings
  const listings = api.parseListings(data);


  return {
    eventId,
    listings,
    rawData: data
  };
}