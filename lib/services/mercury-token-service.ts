/**
 * Mercury OAuth 2.0 Token Management Service
 * Handles token acquisition, caching, and automatic renewal
 */

interface MercuryToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  createdAt: number;
}

export class MercuryTokenService {
  private static instance: MercuryTokenService;
  private token: MercuryToken | null = null;
  private renewalTimer: NodeJS.Timeout | null = null;

  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly tokenEndpoint: string;
  private readonly renewalBuffer = 600; // Renew 10 minutes before expiry

  private constructor() {
    // Check for sandbox mode first
    const sandboxMode = process.env.MERCURY_SANDBOX_MODE === 'true';

    if (sandboxMode) {
      // Use sandbox credentials
      this.consumerKey = '2BI2EFcl2UyPJjEwmA_HRrZ2PgIa';
      this.consumerSecret = 'I_mhfXd6irijN7_fftZXEIa8PSEa';
      this.tokenEndpoint = 'https://key-manager.tn-apis.com/oauth2/token';
      console.log('[Mercury Token] Using sandbox credentials');
    } else {
      // Use production credentials from environment
      this.consumerKey = process.env.MERCURY_CONSUMER_KEY || '';
      this.consumerSecret = process.env.MERCURY_CONSUMER_SECRET || '';
      this.tokenEndpoint = process.env.MERCURY_TOKEN_ENDPOINT || 'https://key-manager.tn-apis.com/oauth2/token';
    }

    // Validate credentials
    if (!this.consumerKey || !this.consumerSecret) {
      console.error('[Mercury Token] Missing credentials! Set MERCURY_SANDBOX_MODE=true or provide MERCURY_CONSUMER_KEY and MERCURY_CONSUMER_SECRET');
    }
  }

  public static getInstance(): MercuryTokenService {
    if (!MercuryTokenService.instance) {
      MercuryTokenService.instance = new MercuryTokenService();
    }
    return MercuryTokenService.instance;
  }

  /**
   * Get a valid OAuth token, fetching a new one if necessary
   */
  async getToken(): Promise<string> {
    // Check if we have a valid token
    if (this.token && this.isTokenValid()) {
      return this.token.access_token;
    }

    // Fetch a new token
    return this.refreshToken();
  }

  /**
   * Fetch a new OAuth token from Mercury
   */
  private async refreshToken(): Promise<string> {
    try {
      console.log('[Mercury Token] Fetching new OAuth token...');

      // Debug: Log credentials being used (without showing full secret)
      console.log('[Mercury Token] Using Consumer Key:', this.consumerKey);
      console.log('[Mercury Token] Consumer Secret length:', this.consumerSecret.length);

      // Create Basic auth header - ensure no line breaks or extra spaces
      const credentials = `${this.consumerKey}:${this.consumerSecret}`;
      const basicAuth = Buffer.from(credentials, 'utf-8').toString('base64');

      // Debug: Log the auth header format
      const authHeader = `Basic ${basicAuth}`;
      console.log('[Mercury Token] Auth header format check:', authHeader.substring(0, 50) + '...');

      // Request new token
      const response = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get OAuth token: ${response.status} - ${error}`);
      }

      const tokenData = await response.json();

      // Store token with timestamp
      this.token = {
        ...tokenData,
        createdAt: Date.now(),
      };

      console.log(`[Mercury Token] Token acquired, expires in ${tokenData.expires_in} seconds`);

      // Schedule renewal
      this.scheduleRenewal();

      return this.token.access_token;
    } catch (error) {
      console.error('[Mercury Token] Failed to refresh token:', error);
      throw error;
    }
  }

  /**
   * Check if the current token is still valid
   */
  private isTokenValid(): boolean {
    if (!this.token) return false;

    const expiresAt = this.token.createdAt + (this.token.expires_in * 1000);
    const now = Date.now();
    const timeUntilExpiry = (expiresAt - now) / 1000;

    // Consider token invalid if it expires in less than 2 minutes
    return timeUntilExpiry > 120;
  }

  /**
   * Schedule automatic token renewal
   */
  private scheduleRenewal(): void {
    if (this.renewalTimer) {
      clearTimeout(this.renewalTimer);
    }

    if (!this.token) return;

    // Schedule renewal for 10 minutes before expiry
    const renewalTime = (this.token.expires_in - this.renewalBuffer) * 1000;

    this.renewalTimer = setTimeout(async () => {
      console.log('[Mercury Token] Auto-renewing token...');
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('[Mercury Token] Auto-renewal failed:', error);
        // Retry after 30 seconds
        setTimeout(() => this.refreshToken(), 30000);
      }
    }, renewalTime);

    console.log(`[Mercury Token] Renewal scheduled in ${renewalTime / 1000 / 60} minutes`);
  }

  /**
   * Revoke the current token (cleanup)
   */
  async revokeToken(): Promise<void> {
    if (!this.token) return;

    try {
      const basicAuth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');

      await fetch('https://key-manager.tn-apis.com/oauth2/revoke', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `token=${this.token.access_token}`,
      });

      console.log('[Mercury Token] Token revoked successfully');
    } catch (error) {
      console.error('[Mercury Token] Failed to revoke token:', error);
    } finally {
      this.token = null;
      if (this.renewalTimer) {
        clearTimeout(this.renewalTimer);
        this.renewalTimer = null;
      }
    }
  }

  /**
   * Get token expiry information
   */
  getTokenInfo(): { valid: boolean; expiresIn?: number } {
    if (!this.token) {
      return { valid: false };
    }

    const expiresAt = this.token.createdAt + (this.token.expires_in * 1000);
    const now = Date.now();
    const expiresIn = Math.max(0, (expiresAt - now) / 1000);

    return {
      valid: this.isTokenValid(),
      expiresIn,
    };
  }

  /**
   * Force token refresh (useful for testing)
   */
  async forceRefresh(): Promise<string> {
    console.log('[Mercury Token] Forcing token refresh...');
    return this.refreshToken();
  }
}

// Export singleton instance
export const mercuryTokenService = MercuryTokenService.getInstance();