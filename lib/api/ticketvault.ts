/**
 * TicketNetwork TicketVault API Client
 * Handles ticket delivery - barcodes and PDF e-tickets
 */

import { mercuryTokenService } from '@/lib/services/mercury-token-service';

// TicketVault API Types
export interface TicketBarcodes {
  mercuryTransactionId: number;
  barcodes: Array<{
    seatNumber: number;
    barcode: string;
    barcodeType: {
      id: number;
      description: string; // e.g., "QR", "PDF417"
    };
  }>;
}

export interface TicketPDF {
  mercuryTransactionId: number;
  pdfData: string; // Base64 encoded PDF
  pageCount: number;
}

export interface TransferUrl {
  mercuryTransactionId: number;
  mobileTransferUrls: string[];
}

class TicketVaultAPI {
  private baseUrl: string;
  private brokerId: string;

  constructor() {
    // TicketVault uses the same base domain as other TN APIs
    const isSandbox = process.env.MERCURY_SANDBOX_MODE === 'true';
    this.baseUrl = isSandbox
      ? 'https://sandbox.tn-apis.com/ticketvault/v2'
      : 'https://www.tn-apis.com/ticketvault/v2';

    this.brokerId = process.env.MERCURY_BROKER_ID || '2001';
  }

  /**
   * Make authenticated request to TicketVault API
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
    console.log(`[TicketVault API] ${method} ${url}`);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error(`[TicketVault API] Error ${response.status}: ${responseText}`);

        // Handle specific error codes
        if (response.status === 404) {
          throw new Error('Tickets not yet available in TicketVault. They may still be processing.');
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error('TicketVault authentication failed');
        }

        throw new Error(`TicketVault API error: ${response.status} - ${responseText}`);
      }

      // Parse JSON response if content exists
      if (responseText) {
        return JSON.parse(responseText);
      }

      return {} as T;
    } catch (error) {
      console.error('[TicketVault API] Request failed:', error);
      throw error;
    }
  }

  /**
   * Get barcodes for a Mercury order
   * These are typically available for mobile/digital tickets
   */
  async getBarcodes(mercuryTransactionId: string | number): Promise<TicketBarcodes | null> {
    try {
      console.log(`[TicketVault API] Fetching barcodes for Mercury transaction ${mercuryTransactionId}`);

      const response = await this.makeRequest<TicketBarcodes>(
        'GET',
        `/mercury/${mercuryTransactionId}/barcodes`
      );

      console.log(`[TicketVault API] Found ${response.barcodes?.length || 0} barcodes`);
      return response;
    } catch (error) {
      // Barcodes may not be available for all ticket types
      if (error instanceof Error && error.message.includes('404')) {
        console.log(`[TicketVault API] No barcodes available for transaction ${mercuryTransactionId}`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Get e-tickets as PDF for a Mercury order
   * Returns a base64 encoded PDF with one page per ticket
   */
  async getETickets(mercuryTransactionId: string | number): Promise<TicketPDF | null> {
    try {
      console.log(`[TicketVault API] Fetching e-tickets for Mercury transaction ${mercuryTransactionId}`);

      const response = await this.makeRequest<TicketPDF>(
        'GET',
        `/mercury/${mercuryTransactionId}/etickets`
      );

      if (response.pdfData) {
        console.log(`[TicketVault API] Retrieved PDF with ${response.pageCount || 1} pages`);
        return response;
      }

      return null;
    } catch (error) {
      // E-tickets may not be available for all ticket types
      if (error instanceof Error && error.message.includes('404')) {
        console.log(`[TicketVault API] No e-tickets available for transaction ${mercuryTransactionId}`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Get mobile transfer URLs for tickets
   * Used for venues that support mobile ticket transfer
   */
  async getTransferUrls(mercuryTransactionId: string | number): Promise<TransferUrl | null> {
    try {
      console.log(`[TicketVault API] Fetching transfer URLs for Mercury transaction ${mercuryTransactionId}`);

      // Note: This endpoint might be on Mercury API, not TicketVault
      // Adjust if needed based on actual API response
      const response = await this.makeRequest<TransferUrl>(
        'GET',
        `/mercury/${mercuryTransactionId}/transferurls`
      );

      if (response.mobileTransferUrls?.length > 0) {
        console.log(`[TicketVault API] Found ${response.mobileTransferUrls.length} transfer URLs`);
        return response;
      }

      return null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        console.log(`[TicketVault API] No transfer URLs available for transaction ${mercuryTransactionId}`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Get all available ticket delivery methods for an order
   * Tries all methods and returns what's available
   */
  async getAllDeliveryMethods(mercuryTransactionId: string | number): Promise<{
    barcodes?: TicketBarcodes;
    pdf?: TicketPDF;
    transferUrls?: TransferUrl;
    availableMethods: string[];
  }> {
    console.log(`[TicketVault API] Fetching all delivery methods for transaction ${mercuryTransactionId}`);

    const results: {
      barcodes?: TicketBarcodes;
      pdf?: TicketPDF;
      transferUrls?: TransferUrl;
      availableMethods: string[];
    } = {
      availableMethods: []
    };

    // Try all methods in parallel
    const [barcodes, pdf, transferUrls] = await Promise.allSettled([
      this.getBarcodes(mercuryTransactionId),
      this.getETickets(mercuryTransactionId),
      this.getTransferUrls(mercuryTransactionId)
    ]);

    // Process barcodes
    if (barcodes.status === 'fulfilled' && barcodes.value) {
      results.barcodes = barcodes.value;
      results.availableMethods.push('barcodes');
    }

    // Process PDF
    if (pdf.status === 'fulfilled' && pdf.value) {
      results.pdf = pdf.value;
      results.availableMethods.push('pdf');
    }

    // Process transfer URLs
    if (transferUrls.status === 'fulfilled' && transferUrls.value) {
      results.transferUrls = transferUrls.value;
      results.availableMethods.push('transferUrls');
    }

    console.log(`[TicketVault API] Available methods: ${results.availableMethods.join(', ') || 'none'}`);
    return results;
  }

  /**
   * Save PDF ticket to file system (for email attachment)
   */
  async savePdfToFile(pdfData: string, filePath: string): Promise<void> {
    const fs = await import('fs/promises');
    const buffer = Buffer.from(pdfData, 'base64');
    await fs.writeFile(filePath, buffer);
    console.log(`[TicketVault API] Saved PDF to ${filePath}`);
  }

  /**
   * Generate QR code image from barcode data
   * Can be used to create ticket images for email
   */
  async generateQRCode(barcodeData: string): Promise<string> {
    // This would use a QR code library like qrcode
    // For now, return the raw barcode data
    // In production, you'd generate an actual QR code image
    return barcodeData;
  }
}

// Export singleton instance
export const ticketVaultAPI = new TicketVaultAPI();