import crypto from 'crypto';

interface TEEvent {
  id: number;
  name: string;
  occurs_at: string;
  venue: {
    id: number;
    name: string;
    city: string;
    state: string;
    country: string;
  };
  category: {
    id: number;
    name: string;
  };
  performers: Array<{
    id: number;
    name: string;
    category: string;
  }>;
  popularity_score: number;
}

interface TETicketGroup {
  id: number;
  section: string;
  row: string;
  quantity: number;
  price: number;
  retail_price?: number;
  format: string;
  delivery_methods: string[];
  splits: number[];
}

export class TicketEvolutionAPI {
  private apiToken: string;
  private apiSecret: string;
  private officeId: string;
  private baseUrl: string;

  constructor() {
    this.apiToken = process.env.TICKET_EVOLUTION_API_TOKEN || '';
    this.apiSecret = process.env.TICKET_EVOLUTION_API_SECRET || '';
    this.officeId = process.env.TICKET_EVOLUTION_OFFICE_ID || '';

    // Use sandbox for testing, production URL would be: https://api.ticketevolution.com
    this.baseUrl = process.env.TICKET_EVOLUTION_ENV === 'production'
      ? 'https://api.ticketevolution.com'
      : 'https://api.sandbox.ticketevolution.com';
  }

  private generateSignature(method: string, path: string, params: any = {}): string {
    // Sort parameters alphabetically
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // Create base string for signature
    const baseString = [
      method.toUpperCase(),
      path,
      sortedParams
    ].filter(Boolean).join('&');

    // Generate HMAC SHA256 signature
    const hmac = crypto.createHmac('sha256', this.apiSecret);
    hmac.update(baseString);
    return Buffer.from(hmac.digest()).toString('base64');
  }

  private async makeRequest(method: string, path: string, params: any = {}, body?: any) {
    const signature = this.generateSignature(method, path, params);

    const headers: any = {
      'X-Token': this.apiToken,
      'X-Signature': signature,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    const url = new URL(`${this.baseUrl}${path}`);
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Ticket Evolution API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  async searchEvents(params: {
    q?: string;
    category_id?: number;
    venue_id?: number;
    performer_id?: number;
    city?: string;
    state?: string;
    occurs_at_gte?: string;
    occurs_at_lte?: string;
    page?: number;
    per_page?: number;
    order_by?: string;
  }) {
    // Filter out undefined values
    const cleanParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const response = await this.makeRequest('GET', '/v9/events', cleanParams);
    return response;
  }

  async getEvent(eventId: number) {
    const response = await this.makeRequest('GET', `/v9/events/${eventId}`);
    return response;
  }

  async getTicketGroups(eventId: number, params: {
    quantity?: number;
    section?: string;
    order_by?: string;
    page?: number;
    per_page?: number;
  } = {}) {
    const cleanParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const response = await this.makeRequest('GET', `/v9/ticket_groups`, {
      event_id: eventId,
      ...cleanParams
    });
    return response;
  }

  async calculateAveragePrice(eventId: number): Promise<number> {
    try {
      const ticketGroups = await this.getTicketGroups(eventId, {
        per_page: 100,
        order_by: 'price'
      });

      if (!ticketGroups.ticket_groups || ticketGroups.ticket_groups.length === 0) {
        return 0;
      }

      const prices = ticketGroups.ticket_groups.map((group: TETicketGroup) => group.price);
      const total = prices.reduce((sum: number, price: number) => sum + price, 0);
      return Math.round(total / prices.length);
    } catch (error) {
      console.error('Error calculating average price:', error);
      return 0;
    }
  }

  async getPriceRange(eventId: number): Promise<{ min: number; max: number; average: number }> {
    try {
      const ticketGroups = await this.getTicketGroups(eventId, {
        per_page: 100,
        order_by: 'price'
      });

      if (!ticketGroups.ticket_groups || ticketGroups.ticket_groups.length === 0) {
        return { min: 0, max: 0, average: 0 };
      }

      const prices = ticketGroups.ticket_groups.map((group: TETicketGroup) => group.price);

      return {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: Math.round(prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length)
      };
    } catch (error) {
      console.error('Error getting price range:', error);
      return { min: 0, max: 0, average: 0 };
    }
  }

  // Map Ticket Evolution categories to our Sport enum
  mapCategoryToSport(category: string): string {
    const mapping: { [key: string]: string } = {
      'football': 'NFL',
      'basketball': 'NBA',
      'baseball': 'MLB',
      'hockey': 'NHL',
      'soccer': 'SOCCER',
      'mma': 'UFC',
      'auto racing': 'F1',
      'nfl': 'NFL',
      'nba': 'NBA',
      'mlb': 'MLB',
      'nhl': 'NHL',
      'ncaa football': 'NFL',
      'ncaa basketball': 'NBA',
    };

    const lowerCategory = category.toLowerCase();
    return mapping[lowerCategory] || 'OTHER';
  }

  // Create a purchase/hold a ticket group
  async holdTickets(ticketGroupId: number, quantity: number) {
    // This would integrate with TE's checkout API
    // For now, return mock response
    return {
      success: true,
      hold_id: `hold_${ticketGroupId}_${Date.now()}`,
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    };
  }

  // Complete a ticket purchase
  async purchaseTickets(holdId: string, paymentInfo: any) {
    // This would complete the purchase through TE
    // For now, return mock response
    return {
      success: true,
      order_id: `order_${Date.now()}`,
      tickets: [],
    };
  }
}

// Singleton instance
export const ticketEvolution = new TicketEvolutionAPI();