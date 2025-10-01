import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';
import { TicketEvolutionEvent, TicketEvolutionTicket, EventDetails, Sport } from '@/types';

export class TicketEvolutionAPI {
  private client: AxiosInstance;
  private apiToken: string;
  private apiSecret: string;
  private officeId: string;

  constructor() {
    const env = process.env.TICKET_EVOLUTION_ENV || 'sandbox';
    const baseURL = env === 'production'
      ? 'https://api.ticketevolution.com/v9'
      : 'https://api.sandbox.ticketevolution.com/v9';

    this.apiToken = process.env.TICKET_EVOLUTION_API_TOKEN!;
    this.apiSecret = process.env.TICKET_EVOLUTION_API_SECRET!;
    this.officeId = process.env.TICKET_EVOLUTION_OFFICE_ID!;

    this.client = axios.create({
      baseURL,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      const signature = this.generateSignature(
        config.method!.toUpperCase(),
        config.url!,
        config.params || {}
      );

      config.headers['X-Token'] = this.apiToken;
      config.headers['X-Signature'] = signature;

      return config;
    });
  }

  private generateSignature(method: string, path: string, params: any): string {
    // Sort params alphabetically
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    const baseString = [
      method,
      path,
      sortedParams
    ].filter(Boolean).join(' ');

    // Create HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', this.apiSecret);
    hmac.update(baseString);

    return Buffer.from(hmac.digest()).toString('base64');
  }

  async searchEvents(params: {
    q?: string;
    category_id?: number;
    venue_id?: number;
    occurs_at_gte?: string;
    occurs_at_lte?: string;
    page?: number;
    per_page?: number;
  }): Promise<TicketEvolutionEvent[]> {
    try {
      const response = await this.client.get('/events', { params });
      return response.data.events || [];
    } catch (error) {
      console.error('Error searching events:', error);
      throw error;
    }
  }

  async getEvent(eventId: string): Promise<TicketEvolutionEvent> {
    try {
      const response = await this.client.get(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  }

  async getTicketsForEvent(eventId: string): Promise<TicketEvolutionTicket[]> {
    try {
      const response = await this.client.get('/tickets', {
        params: {
          event_id: eventId,
          order_by: 'price',
        }
      });
      return response.data.tickets || [];
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  }

  async getAverageTicketPrice(eventId: string, quantity: number = 2): Promise<number> {
    const tickets = await this.getTicketsForEvent(eventId);

    // Filter tickets that match the requested quantity
    const validTickets = tickets.filter(t =>
      t.quantity >= quantity &&
      t.splits.includes(quantity)
    );

    if (validTickets.length === 0) {
      throw new Error('No tickets available for requested quantity');
    }

    // Calculate average price
    const totalPrice = validTickets.reduce((sum, ticket) => sum + (ticket.price * quantity), 0);
    return totalPrice / validTickets.length;
  }

  async purchaseTickets(ticketGroupId: number, quantity: number, price: number): Promise<any> {
    try {
      const response = await this.client.post('/orders', {
        orders: [{
          ticket_group_id: ticketGroupId,
          quantity: quantity,
          price: price,
          office_id: this.officeId,
        }]
      });
      return response.data;
    } catch (error) {
      console.error('Error purchasing tickets:', error);
      throw error;
    }
  }

  mapSportCategory(categoryName: string): Sport {
    const normalized = categoryName.toLowerCase();

    if (normalized.includes('football') || normalized.includes('nfl')) return Sport.NFL;
    if (normalized.includes('basketball') || normalized.includes('nba')) return Sport.NBA;
    if (normalized.includes('baseball') || normalized.includes('mlb')) return Sport.MLB;
    if (normalized.includes('hockey') || normalized.includes('nhl')) return Sport.NHL;
    if (normalized.includes('soccer') || normalized.includes('mls')) return Sport.SOCCER;
    if (normalized.includes('ufc') || normalized.includes('mma')) return Sport.UFC;
    if (normalized.includes('f1') || normalized.includes('formula')) return Sport.F1;

    return Sport.OTHER;
  }

  async convertToEventDetails(teEvent: TicketEvolutionEvent): Promise<EventDetails> {
    const tickets = await this.getTicketsForEvent(teEvent.id.toString());

    const prices = tickets.map(t => t.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    return {
      id: teEvent.id.toString(),
      name: teEvent.name,
      sport: this.mapSportCategory(teEvent.category.name),
      venue: teEvent.venue.name,
      city: teEvent.venue.city,
      state: teEvent.venue.state,
      datetime: new Date(teEvent.occurs_at),
      minPrice,
      maxPrice,
      averagePrice,
      inventoryCount: tickets.length,
      tickets: tickets.map(t => ({
        id: t.id.toString(),
        section: t.section,
        row: t.row,
        seatNumbers: t.seat_numbers.split(','),
        price: t.price,
        quantity: t.quantity,
      }))
    };
  }
}

export const ticketEvolution = new TicketEvolutionAPI();