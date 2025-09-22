// SeatGeek API Client
// Free API with public access - much better than scraping!

interface SeatGeekEvent {
  id: number;
  title: string;
  url: string;
  datetime_local: string;
  performers: Array<{
    name: string;
    slug: string;
  }>;
  venue: {
    name: string;
    city: string;
    state: string;
  };
  stats: {
    lowest_price: number | null;
    highest_price: number | null;
    average_price: number | null;
    listing_count: number | null;
  };
}

interface SeatGeekListing {
  id: string;
  section: string;
  row: string;
  price: number;
  quantity: number;
}

export class SeatGeekAPI {
  private baseUrl = 'https://api.seatgeek.com/2';
  private clientId: string;

  constructor(clientId?: string) {
    // Use a demo client ID for testing
    // You can get your own free at: https://seatgeek.com/account/develop
    this.clientId = clientId || process.env.NEXT_PUBLIC_SEATGEEK_CLIENT_ID || 'MzE1NjU2MDl8MTY3NDA4NTcwNy4xMjU2MDc';
  }

  // Search for events
  async searchEvents(query: string, params?: any) {
    const url = new URL(`${this.baseUrl}/events`);
    url.searchParams.append('client_id', this.clientId);
    url.searchParams.append('q', query);

    if (params) {
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
      });
    }


    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`SeatGeek API error: ${response.status}`);
    }

    return await response.json();
  }

  // Get specific event details
  async getEvent(eventId: number) {
    const url = `${this.baseUrl}/events/${eventId}?client_id=${this.clientId}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`SeatGeek API error: ${response.status}`);
    }

    return await response.json();
  }

  // Convert SeatGeek URL to search query
  extractEventFromUrl(url: string): string | null {
    // SeatGeek URLs look like:
    // https://seatgeek.com/raiders-at-chargers-tickets/...
    const match = url.match(/seatgeek\.com\/([^\/]+)-tickets/);
    if (match) {
      return match[1].replace(/-/g, ' ');
    }
    return null;
  }

  // Convert to our format
  transformEvent(event: SeatGeekEvent) {
    return {
      id: event.id.toString(),
      name: event.title,
      venue: event.venue.name,
      city: event.venue.city,
      state: event.venue.state,
      datetime: new Date(event.datetime_local),
      minPrice: event.stats.lowest_price || 0,
      maxPrice: event.stats.highest_price || 0,
      averagePrice: event.stats.average_price || 0,
      inventoryCount: event.stats.listing_count || 0,
      url: event.url,
      performers: event.performers.map(p => p.name).join(' vs ')
    };
  }
}

// Helper function to get event data from SeatGeek
export async function getSeatGeekEvent(query: string) {
  const api = new SeatGeekAPI();

  // Search for the event
  const searchResult = await api.searchEvents(query, {
    per_page: 1,
    'datetime_utc.gte': new Date().toISOString().split('T')[0]
  });

  if (!searchResult.events || searchResult.events.length === 0) {
    throw new Error('No events found');
  }

  const event = searchResult.events[0];
  const transformed = api.transformEvent(event);

  // Get more details if needed
  const details = await api.getEvent(event.id);

  return {
    ...transformed,
    raw: details
  };
}