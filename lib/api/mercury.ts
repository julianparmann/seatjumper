/**
 * TicketNetwork Mercury API Client
 * Handles ticket inventory, locking, and purchasing through Mercury
 */

import crypto from 'crypto';
import { mercuryTokenService } from '@/lib/services/mercury-token-service';

// Mercury API Types
export interface MercuryEvent {
  id: string;
  name: string;
  date: string;
  venue: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
  performers: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export interface MercuryTicket {
  id: string;
  eventId: string;
  section: string;
  row: string;
  seatNumbers: string[];
  quantity: number;
  price: number; // Wholesale price from broker
  retailPrice?: number;
  listingId: string;
  brokerId: string;
  deliveryMethod: string;
  splits: number[];
  notes?: string;
  viewFromSeat?: string;
}

export interface MercuryHold {
  holdId: string;
  ticketId: string;
  userId: string;
  sessionId: string;
  expiresAt: Date;
  status: 'active' | 'expired' | 'converted' | 'released';
  ticketDetails: MercuryTicket;
}

export interface MercuryOrder {
  orderId: string;
  holdId: string;
  ticketId: string;
  purchasePrice: number;
  purchaseTime: Date;
  status: 'pending' | 'confirmed' | 'failed';
  barcodes?: string[];
  deliveryInfo?: any;
}

export interface MercuryInventoryRequest {
  eventId: string;
  minQuantity?: number;
  maxQuantity?: number;
  sections?: string[];
  maxPrice?: number;
}

export class MercuryAPI {
  private mercuryApiUrl: string;
  private catalogApiUrl: string;
  private webhookApiUrl: string;
  private ticketVaultApiUrl: string;
  private websiteConfigId: string;
  private catalogConfigId: string;
  private brokerId: string;
  private sandboxMode: boolean;
  private webhookSecret: string;

  constructor() {
    this.mercuryApiUrl = process.env.MERCURY_API_URL || 'https://api.sandbox.mercury.ticketnetwork.com';
    this.catalogApiUrl = process.env.MERCURY_CATALOG_API_URL || 'https://api.sandbox.catalog.ticketnetwork.com';
    this.webhookApiUrl = process.env.MERCURY_WEBHOOK_API_URL || 'https://api.sandbox.webhook.ticketnetwork.com';
    this.ticketVaultApiUrl = process.env.MERCURY_TICKETVAULT_API_URL || 'https://api.sandbox.ticketvault.ticketnetwork.com';
    this.websiteConfigId = process.env.MERCURY_WEBSITE_CONFIG_ID || '27735';
    this.catalogConfigId = process.env.MERCURY_CATALOG_CONFIG_ID || '23884';
    this.brokerId = process.env.MERCURY_BROKER_ID || '13870';
    this.sandboxMode = process.env.MERCURY_SANDBOX_MODE === 'true';
    this.webhookSecret = process.env.MERCURY_WEBHOOK_SECRET || '';
  }

  /**
   * Get the appropriate API base URL for a given service
   */
  private getApiUrl(service: 'mercury' | 'catalog' | 'webhook' | 'ticketvault'): string {
    switch (service) {
      case 'catalog':
        return this.catalogApiUrl;
      case 'webhook':
        return this.webhookApiUrl;
      case 'ticketvault':
        return this.ticketVaultApiUrl;
      default:
        return this.mercuryApiUrl;
    }
  }

  /**
   * Get the appropriate context headers for the API call
   */
  private getContextHeaders(service: 'mercury' | 'catalog' | 'webhook' | 'ticketvault'): Record<string, string> {
    const headers: Record<string, string> = {};

    // Add appropriate website config ID based on service
    if (service === 'catalog') {
      headers['x-listing-context'] = `website-config-id = ${this.catalogConfigId}`;
    } else {
      headers['x-listing-context'] = `website-config-id = ${this.websiteConfigId}`;
    }

    // Add broker ID for Mercury API
    if (service === 'mercury') {
      headers['x-listing-context'] += `, broker-id = ${this.brokerId}`;
    }

    return headers;
  }

  /**
   * Make authenticated request to Mercury API
   */
  private async makeRequest<T>(
    method: string,
    path: string,
    body?: any,
    service: 'mercury' | 'catalog' | 'webhook' | 'ticketvault' = 'mercury'
  ): Promise<T> {
    try {
      // Get OAuth token
      const token = await mercuryTokenService.getToken();

      // Get appropriate base URL and headers
      const baseUrl = this.getApiUrl(service);
      const contextHeaders = this.getContextHeaders(service);
      const url = `${baseUrl}${path}`;

      console.log(`[Mercury API] ${method} ${url}`);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...contextHeaders,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Mercury API] Error response:`, errorText);
        throw new Error(`Mercury API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[Mercury API] Request failed:', error);

      // If it's a development environment and we get auth errors, use mock data
      if (this.sandboxMode && error instanceof Error && error.message.includes('401')) {
        console.log('[Mercury API] Auth failed in sandbox, using mock data');
        return this.getMockResponse(method, path, body) as T;
      }

      throw error;
    }
  }

  /**
   * Search for events using Catalog API
   */
  async searchEvents(query: string): Promise<MercuryEvent[]> {
    return this.makeRequest('GET', `/events/search?q=${encodeURIComponent(query)}`, undefined, 'catalog');
  }

  /**
   * Get event details using Catalog API
   */
  async getEvent(eventId: string): Promise<MercuryEvent> {
    return this.makeRequest('GET', `/events/${eventId}`, undefined, 'catalog');
  }

  /**
   * Get categories from Catalog API
   */
  async getCategories(): Promise<any[]> {
    return this.makeRequest('GET', '/categories', undefined, 'catalog');
  }

  /**
   * Get performers from Catalog API
   */
  async getPerformers(categoryId?: string): Promise<any[]> {
    const path = categoryId ? `/performers?categoryId=${categoryId}` : '/performers';
    return this.makeRequest('GET', path, undefined, 'catalog');
  }

  /**
   * Get available inventory for an event
   */
  async getInventory(request: MercuryInventoryRequest): Promise<MercuryTicket[]> {
    return this.makeRequest('POST', '/inventory/search', request);
  }

  /**
   * Create a hold/lock on tickets
   * Returns a hold that expires in 15-30 seconds (configurable)
   */
  async createHold(
    ticketId: string,
    userId: string,
    sessionId: string,
    holdDurationSeconds: number = 30
  ): Promise<MercuryHold> {
    return this.makeRequest('POST', '/holds/create', {
      ticketId,
      userId,
      sessionId,
      holdDurationSeconds,
    });
  }

  /**
   * Extend an existing hold
   */
  async extendHold(holdId: string, additionalSeconds: number = 30): Promise<MercuryHold> {
    return this.makeRequest('POST', `/holds/${holdId}/extend`, {
      additionalSeconds,
    });
  }

  /**
   * Release a hold (cleanup)
   */
  async releaseHold(holdId: string): Promise<void> {
    return this.makeRequest('DELETE', `/holds/${holdId}`);
  }

  /**
   * Convert a hold to a purchase
   */
  async purchaseTickets(holdId: string, paymentInfo?: any): Promise<MercuryOrder> {
    return this.makeRequest('POST', '/orders/create', {
      holdId,
      paymentInfo,
    });
  }

  /**
   * Get order status
   */
  async getOrder(orderId: string): Promise<MercuryOrder> {
    return this.makeRequest('GET', `/orders/${orderId}`);
  }

  /**
   * Get ticket barcodes/delivery info
   */
  async getTicketDelivery(orderId: string): Promise<any> {
    return this.makeRequest('GET', `/orders/${orderId}/delivery`);
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Mock responses for development/testing
   */
  private getMockResponse(method: string, path: string, body?: any): any {
    // Mock inventory search
    if (path.includes('/inventory/search')) {
      return this.getMockInventory();
    }

    // Mock hold creation
    if (path.includes('/holds/create')) {
      return this.getMockHold(body);
    }

    // Mock purchase
    if (path.includes('/orders/create')) {
      return this.getMockOrder(body);
    }

    // Mock event search
    if (path.includes('/events/search')) {
      return this.getMockEvents();
    }

    return null;
  }

  private getMockInventory(): MercuryTicket[] {
    return [
      {
        id: 'mock-ticket-1',
        eventId: 'mock-event-1',
        section: '101',
        row: 'A',
        seatNumbers: ['1', '2'],
        quantity: 2,
        price: 150, // Wholesale price
        retailPrice: 225,
        listingId: 'listing-1',
        brokerId: 'broker-1',
        deliveryMethod: 'eticket',
        splits: [1, 2],
      },
      {
        id: 'mock-ticket-2',
        eventId: 'mock-event-1',
        section: '201',
        row: 'K',
        seatNumbers: ['10', '11', '12', '13'],
        quantity: 4,
        price: 85,
        retailPrice: 125,
        listingId: 'listing-2',
        brokerId: 'broker-2',
        deliveryMethod: 'mobile_transfer',
        splits: [2, 4],
      },
      {
        id: 'mock-ticket-3',
        eventId: 'mock-event-1',
        section: 'Floor',
        row: '1',
        seatNumbers: ['5', '6'],
        quantity: 2,
        price: 450,
        retailPrice: 650,
        listingId: 'listing-3',
        brokerId: 'broker-3',
        deliveryMethod: 'will_call',
        splits: [1, 2],
        notes: 'VIP Access included',
      },
    ];
  }

  private getMockHold(body: any): MercuryHold {
    const mockTicket = this.getMockInventory()[0];
    return {
      holdId: `hold-${Date.now()}`,
      ticketId: body.ticketId || 'mock-ticket-1',
      userId: body.userId,
      sessionId: body.sessionId,
      expiresAt: new Date(Date.now() + (body.holdDurationSeconds || 30) * 1000),
      status: 'active',
      ticketDetails: mockTicket,
    };
  }

  private getMockOrder(body: any): MercuryOrder {
    return {
      orderId: `order-${Date.now()}`,
      holdId: body.holdId,
      ticketId: 'mock-ticket-1',
      purchasePrice: 150,
      purchaseTime: new Date(),
      status: 'confirmed',
      barcodes: ['MOCK-BARCODE-123456', 'MOCK-BARCODE-789012'],
    };
  }

  private getMockEvents(): MercuryEvent[] {
    return [
      {
        id: 'mock-event-1',
        name: 'Los Angeles Lakers vs Boston Celtics',
        date: '2025-02-15T19:30:00Z',
        venue: {
          id: 'venue-1',
          name: 'Crypto.com Arena',
          city: 'Los Angeles',
          state: 'CA',
        },
        performers: [
          { id: 'team-1', name: 'Los Angeles Lakers', type: 'home' },
          { id: 'team-2', name: 'Boston Celtics', type: 'away' },
        ],
      },
    ];
  }
}

// Export singleton instance
export const mercuryAPI = new MercuryAPI();