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
}

export interface MercuryCreditLimits {
  dailyBuyCreditLimit: { value: number; currencyCode: string };
  dailyBuyCreditRemaining: { value: number; currencyCode: string };
  weeklyBuyCreditLimit: { value: number; currencyCode: string };
  weeklyBuyCreditRemaining: { value: number; currencyCode: string };
  coinBuyCreditRemaining: { value: number; currencyCode: string };
  mercuryActive: boolean;
  canBuy: boolean;
  canSell: boolean;
  coinWalletEnabled: boolean;
  buyFee: number;
  sellFee: number;
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
    // Each service has its own domain
    const sandboxMode = process.env.MERCURY_SANDBOX_MODE === 'true';

    // Use sandbox or production base URL
    // Production uses www.tn-apis.com as per Mercury v5 specification
    const baseUrl = sandboxMode ? 'https://sandbox.tn-apis.com' : 'https://www.tn-apis.com';

    // Set service URLs based on swagger.json definitions
    this.mercuryApiUrl = process.env.MERCURY_API_URL || `${baseUrl}/mercury/v5`;
    this.catalogApiUrl = process.env.MERCURY_CATALOG_API_URL || `${baseUrl}/catalog/v2`;
    this.webhookApiUrl = process.env.MERCURY_WEBHOOK_API_URL || `${baseUrl}/webhook/v1`;
    this.ticketVaultApiUrl = process.env.MERCURY_TICKETVAULT_API_URL || `${baseUrl}/ticketvault/v2`;

    // Use the config IDs from the email
    this.websiteConfigId = process.env.MERCURY_WEBSITE_CONFIG_ID || '27735';
    this.catalogConfigId = process.env.MERCURY_CATALOG_CONFIG_ID || '23884';
    this.brokerId = process.env.MERCURY_BROKER_ID || '13870';
    this.sandboxMode = sandboxMode;
    this.webhookSecret = process.env.MERCURY_WEBHOOK_SECRET || '';

    console.log('[Mercury API] Initialized with URLs:', {
      gateway: baseUrl,
      mercury: this.mercuryApiUrl,
      catalog: this.catalogApiUrl,
      webhook: this.webhookApiUrl,
      ticketvault: this.ticketVaultApiUrl,
      sandboxMode: this.sandboxMode
    });
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

    // Different services use different header names
    if (service === 'catalog') {
      // Catalog API uses X-Listing-Context with website-config-id 23884
      headers['X-Listing-Context'] = `website-config-id=${this.catalogConfigId}`;
    } else {
      // Mercury API uses X-Identity-Context with broker-id for inventory/orders
      // According to docs and email: broker-id=13870 for Mercury API
      headers['X-Identity-Context'] = `broker-id=${this.brokerId}`;
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
          'Accept': 'application/json',
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

      // Disabled mock data fallback - we want real API responses
      // if (this.sandboxMode && error instanceof Error && error.message.includes('401')) {
      //   console.log('[Mercury API] Auth failed in sandbox, using mock data');
      //   return this.getMockResponse(method, path, body) as T;
      // }

      throw error;
    }
  }

  /**
   * Search for events using Catalog API, then filter by Mercury inventory
   * This ensures we only show events that actually have ticketgroups available
   */
  async searchEvents(query: string): Promise<MercuryEvent[]> {
    try {
      // Step 1: Search Catalog API for events
      // Catalog API requires a search query - use "2025" as default to get all upcoming events
      // This includes sports, theatre, concerts, etc.
      const searchQuery = query || '2025';
      console.log(`[Mercury API] Searching Catalog API${query ? ` for: "${searchQuery}"` : ' (all 2025 events)'}`);

      const catalogResponse = await this.makeRequest<any>(
        'GET',
        `/events/search?q=${encodeURIComponent(searchQuery)}`,
        undefined,
        'catalog'
      );

      // Handle Catalog API response format
      const catalogEvents = catalogResponse?.results || catalogResponse?.events || [];
      if (!Array.isArray(catalogEvents)) {
        console.log('[Mercury API] No events from Catalog API');
        return [];
      }

      console.log(`[Mercury API] Found ${catalogEvents.length} events from Catalog`);

      // Map Catalog API structure to our event format
      // Catalog API uses nested text objects for names
      const events: MercuryEvent[] = catalogEvents.slice(0, 50).map((catalogEvent: any) => ({
        id: catalogEvent.id,
        name: catalogEvent.text?.name || catalogEvent.name || 'Event TBA',
        date: catalogEvent.date,
        venue: {
          id: catalogEvent.venue?.id?.toString() || '',
          name: catalogEvent.venue?.text?.name || 'Venue TBA',
          city: catalogEvent.city?.text?.name || '',
          state: catalogEvent.stateProvince?.text?.abbr || '',
        },
        performers: catalogEvent.performers || [],
      }));

      console.log(`[Mercury API] Returning ${events.length} events from Catalog`);
      return events;

    } catch (error) {
      console.error('[Mercury API] searchEvents error:', error);
      return [];
    }
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
   * Get Mercury credit limits for the broker account
   * This shows available credit for purchasing tickets
   */
  async getCreditLimits(): Promise<MercuryCreditLimits> {
    console.log('[Mercury API] Fetching credit limits');

    const response = await this.makeRequest<MercuryCreditLimits>(
      'GET',
      '/creditlimits',
      undefined,
      'mercury'
    );

    console.log('[Mercury API] Credit limits:', {
      dailyRemaining: response.dailyBuyCreditRemaining?.value,
      weeklyRemaining: response.weeklyBuyCreditRemaining?.value,
      coinWallet: response.coinBuyCreditRemaining?.value,
      canBuy: response.canBuy
    });

    return response;
  }

  /**
   * Check if sufficient credit is available for a purchase
   */
  async checkSufficientCredit(amount: number): Promise<{ sufficient: boolean; availableCredit: number; message?: string }> {
    try {
      const limits = await this.getCreditLimits();

      if (!limits.canBuy || !limits.mercuryActive) {
        return {
          sufficient: false,
          availableCredit: 0,
          message: 'Mercury buying is not enabled for this account'
        };
      }

      // Check the minimum of all credit limits
      const availableCredit = Math.min(
        limits.dailyBuyCreditRemaining?.value || 0,
        limits.weeklyBuyCreditRemaining?.value || 0,
        limits.coinBuyCreditRemaining?.value || 0
      );

      if (amount > availableCredit) {
        return {
          sufficient: false,
          availableCredit,
          message: `Insufficient credit. Required: $${amount.toFixed(2)}, Available: $${availableCredit.toFixed(2)}`
        };
      }

      return {
        sufficient: true,
        availableCredit
      };
    } catch (error) {
      console.error('[Mercury API] Error checking credit limits:', error);
      // Return false on error to prevent purchases when we can't verify credit
      return {
        sufficient: false,
        availableCredit: 0,
        message: 'Unable to verify credit availability'
      };
    }
  }

  /**
   * Get available inventory for an event
   * Uses the /ticketgroups endpoint as per Mercury v5 API
   */
  async getInventory(request: MercuryInventoryRequest): Promise<MercuryTicket[]> {
    // Convert to query parameters for GET request
    const params = new URLSearchParams();
    if (request.eventId) params.append('eventId', request.eventId);

    console.log(`[Mercury API] Getting inventory for event ${request.eventId}`);
    console.log(`[Mercury API] Using broker-id: ${this.brokerId}`);

    const response = await this.makeRequest<any>(
      'GET',
      `/ticketgroups?${params.toString()}`,
      undefined,
      'mercury'
    );

    console.log(`[Mercury API] Ticketgroups response:`, JSON.stringify(response, null, 2));

    // Transform response to match our MercuryTicket interface
    if (response?.ticketGroups && Array.isArray(response.ticketGroups)) {
      console.log(`[Mercury API] Found ${response.ticketGroups.length} ticket groups`);
      return response.ticketGroups.map((group: any) => ({
        id: group.exchangeTicketGroupId?.toString() || '',
        eventId: group.eventId?.toString() || request.eventId,
        section: group.seats?.section || '',
        row: group.seats?.row || '',
        seatNumbers: group.seats?.lowSeat && group.seats?.highSeat
          ? [group.seats.lowSeat, group.seats.highSeat]
          : [],
        quantity: group.availableQuantity || 0,
        price: group.unitPrice?.wholesalePrice?.value || 0,
        retailPrice: group.unitPrice?.retailPrice?.value,
        listingId: group.exchangeTicketGroupId?.toString() || '',
        brokerId: this.brokerId,
        deliveryMethod: group.deliveryMethods?.[0] || 'eticket',
        splits: group.purchasableQuantities || [],
        notes: group.notes
      }));
    }

    // Log if we got an unexpected response format
    console.log(`[Mercury API] No ticketGroups found in response, returning empty array`);
    return [];
  }

  /**
   * Create a hold/lock on tickets
   * Uses the /lock endpoint as per Mercury v5 API
   */
  async createHold(
    ticketGroupId: string,
    quantity: number,
    wholesalePrice: number,
    lockRequestId?: string
  ): Promise<MercuryHold> {
    const requestId = lockRequestId || this.generateUUID();

    const response = await this.makeRequest<any>('POST', '/lock', {
      lockRequestId: requestId,
      ticketGroupId: parseInt(ticketGroupId),
      quantity,
      wholesalePrice,
      overridePrice: false,
      lockDurationInSeconds: 60 // Mercury v5 uses this parameter
    });

    // Transform response to match our MercuryHold interface
    return {
      holdId: response.lockRequestId,
      ticketId: ticketGroupId,
      userId: '', // Not used in Mercury v5
      sessionId: '', // Not used in Mercury v5
      expiresAt: new Date(Date.now() + 60000), // 60 seconds from now
      status: 'active'
    };
  }

  /**
   * Generate UUID for lock requests
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
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
   * Uses the /orders endpoint as per Mercury v5 API
   */
  async purchaseTickets(lockRequestId: string, paymentInfo?: any): Promise<MercuryOrder> {
    const response = await this.makeRequest<any>('POST', '/orders', {
      lockRequestId,
      buyRequestId: this.generateUUID(),
      notes: 'Order from SeatJumper'
    });

    // Transform response to match our MercuryOrder interface
    return {
      orderId: response.mercuryTransactionId?.toString() || '',
      holdId: lockRequestId,
      ticketId: '',
      purchasePrice: response.totalPrice?.value || 0,
      purchaseTime: new Date(response.date || Date.now()),
      status: 'confirmed',
      barcodes: [],
      deliveryInfo: response.delivery
    };
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