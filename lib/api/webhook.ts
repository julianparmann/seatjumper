/**
 * TicketNetwork Webhook API Client
 * Handles webhook registration and management for real-time updates
 */

import { mercuryTokenService } from '@/lib/services/mercury-token-service';
import crypto from 'crypto';

// Webhook API Types
export interface WebhookFilter {
  name: string;
  description: string;
}

export interface WebhookRegistration {
  id?: string;
  webHookUri: string;
  secret?: string;
  description?: string;
  isPaused?: boolean;
  filters?: string[];
  headers?: Record<string, string>;
  properties?: Record<string, any>;
}

export interface WebhookNotification {
  id: string;
  attempt: number;
  properties: {
    mercuryTransactionId?: string;
    eventType?: string;
    timestamp?: string;
    [key: string]: any;
  };
  notifications: Array<{
    action: string;
    data: any;
  }>;
}

class WebhookAPI {
  private baseUrl: string;
  private brokerId: string;
  private webhookSecret: string;

  constructor() {
    const isSandbox = process.env.MERCURY_SANDBOX_MODE === 'true';
    this.baseUrl = isSandbox
      ? 'https://sandbox.tn-apis.com/webhook/v1'
      : 'https://www.tn-apis.com/webhook/v1';

    this.brokerId = process.env.MERCURY_BROKER_ID || '2001';

    // Generate or use existing webhook secret for signature verification
    this.webhookSecret = process.env.WEBHOOK_SECRET || this.generateSecret();
  }

  /**
   * Generate a cryptographically secure webhook secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Make authenticated request to Webhook API
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: any
  ): Promise<T> {
    const token = await mercuryTokenService.getToken();

    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'X-Identity-Context': `broker-id=${this.brokerId}`,
      'Accept': 'application/json',
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const url = `${this.baseUrl}${path}`;
    console.log(`[Webhook API] ${method} ${url}`);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error(`[Webhook API] Error ${response.status}: ${responseText}`);
        throw new Error(`Webhook API error: ${response.status} - ${responseText}`);
      }

      if (responseText) {
        return JSON.parse(responseText);
      }

      return {} as T;
    } catch (error) {
      console.error('[Webhook API] Request failed:', error);
      throw error;
    }
  }

  /**
   * Get available webhook filters
   * These determine which events trigger webhook notifications
   */
  async getFilters(): Promise<WebhookFilter[]> {
    console.log('[Webhook API] Fetching available filters');
    const response = await this.makeRequest<any>('GET', '/webhooks/filters');
    return response.filters || [];
  }

  /**
   * Get all registered webhooks for the current broker
   */
  async getRegistrations(): Promise<WebhookRegistration[]> {
    console.log('[Webhook API] Fetching webhook registrations');
    return this.makeRequest<WebhookRegistration[]>('GET', '/webhooks/registrations');
  }

  /**
   * Register a new webhook
   */
  async registerWebhook(
    webhookUrl: string,
    filters: string[],
    description?: string
  ): Promise<WebhookRegistration> {
    console.log(`[Webhook API] Registering webhook: ${webhookUrl}`);

    const webhook: WebhookRegistration = {
      webHookUri: `${webhookUrl}?NoEcho=yes`, // NoEcho to skip validation during registration
      secret: this.webhookSecret,
      description: description || 'SeatJumper Mercury Order Updates',
      isPaused: false,
      filters: filters
    };

    const response = await this.makeRequest<WebhookRegistration>(
      'POST',
      '/webhooks/registrations',
      webhook
    );

    console.log(`[Webhook API] Webhook registered with ID: ${response.id}`);
    return response;
  }

  /**
   * Update an existing webhook registration
   */
  async updateWebhook(
    webhookId: string,
    updates: Partial<WebhookRegistration>
  ): Promise<WebhookRegistration> {
    console.log(`[Webhook API] Updating webhook: ${webhookId}`);

    return this.makeRequest<WebhookRegistration>(
      'PUT',
      `/webhooks/registrations/${webhookId}`,
      updates
    );
  }

  /**
   * Delete a webhook registration
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    console.log(`[Webhook API] Deleting webhook: ${webhookId}`);
    await this.makeRequest('DELETE', `/webhooks/registrations/${webhookId}`);
  }

  /**
   * Delete all webhook registrations
   */
  async deleteAllWebhooks(): Promise<void> {
    console.log('[Webhook API] Deleting all webhooks');
    await this.makeRequest('DELETE', '/webhooks/registrations');
  }

  /**
   * Verify webhook signature for security
   */
  verifySignature(payload: string, signature: string): boolean {
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
   * Register webhooks for Mercury order events
   */
  async setupMercuryWebhooks(baseUrl: string): Promise<void> {
    console.log('[Webhook API] Setting up Mercury webhooks');

    try {
      // Get available filters
      const filters = await this.getFilters();
      console.log(`[Webhook API] Available filters:`, filters);

      // Look for Mercury/order related filters
      const mercuryFilters = filters
        .filter(f =>
          f.name.toLowerCase().includes('mercury') ||
          f.name.toLowerCase().includes('order') ||
          f.name.toLowerCase().includes('delivery')
        )
        .map(f => f.name);

      if (mercuryFilters.length === 0) {
        console.warn('[Webhook API] No Mercury-related filters found, using all filters');
        mercuryFilters.push(...filters.map(f => f.name));
      }

      // Check existing registrations
      const existingWebhooks = await this.getRegistrations();
      const webhookUrl = `${baseUrl}/api/webhooks/mercury`;

      // Remove old webhooks for our URL
      for (const webhook of existingWebhooks) {
        if (webhook.webHookUri?.includes(webhookUrl.replace(/https?:\/\//, ''))) {
          console.log(`[Webhook API] Removing existing webhook: ${webhook.id}`);
          await this.deleteWebhook(webhook.id!);
        }
      }

      // Register new webhook
      const registration = await this.registerWebhook(
        webhookUrl,
        mercuryFilters,
        'SeatJumper Mercury Order Status Updates'
      );

      console.log('[Webhook API] Mercury webhooks setup complete:', registration);

      // Save webhook secret to environment if generated
      if (!process.env.WEBHOOK_SECRET) {
        console.log('[Webhook API] Generated webhook secret:', this.webhookSecret);
        console.log('[Webhook API] Add this to your .env file: WEBHOOK_SECRET=' + this.webhookSecret);
      }

    } catch (error) {
      console.error('[Webhook API] Failed to setup webhooks:', error);
      throw error;
    }
  }

  /**
   * Process incoming webhook notification
   */
  processWebhook(notification: WebhookNotification): {
    type: string;
    mercuryTransactionId?: string;
    action?: string;
    data?: any;
  } {
    console.log('[Webhook API] Processing webhook notification:', notification);

    // Extract key information from the notification
    const result = {
      type: notification.properties?.eventType || 'unknown',
      mercuryTransactionId: notification.properties?.mercuryTransactionId,
      action: notification.notifications?.[0]?.action,
      data: notification.notifications?.[0]?.data
    };

    console.log('[Webhook API] Processed webhook:', result);
    return result;
  }
}

// Export singleton instance
export const webhookAPI = new WebhookAPI();