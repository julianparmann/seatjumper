import { chromium, Browser, Page } from 'playwright';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

interface PurchaseDetails {
  ticketId: string;
  userId: string;
  gameUrl: string;
  section: string;
  row: string;
  quantity: number;
  maxPrice: number;
}

interface PurchaseResult {
  success: boolean;
  confirmationCode?: string;
  ticketFile?: string;
  errorMessage?: string;
  purchasePrice?: number;
}

export class TickPickBuyer {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private credentials: { email: string; password: string } | null = null;

  async initialize() {
    // Launch browser in non-headless mode for debugging
    // Set to headless: true in production
    this.browser = await chromium.launch({
      headless: process.env.NODE_ENV === 'production',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox'
      ]
    });

    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      // Save cookies and state for faster login
      storageState: process.env.TICKPICK_STORAGE_STATE
    });

    this.page = await context.newPage();

    // Load credentials from database
    await this.loadCredentials();
  }

  private async loadCredentials() {
    const creds = await prisma.tickPickCredential.findFirst({
      where: { isActive: true }
    });

    if (creds) {
      // Decrypt password (implement your encryption/decryption)
      this.credentials = {
        email: creds.email,
        password: this.decryptPassword(creds.encryptedPwd)
      };
    }
  }

  private decryptPassword(encrypted: string): string {
    // Implement proper encryption/decryption
    // For MVP, could use environment variable
    return process.env.TICKPICK_PASSWORD || encrypted;
  }

  async login() {
    if (!this.page || !this.credentials) {
      throw new Error('Browser not initialized or credentials not loaded');
    }

    try {
      console.log('Logging into TickPick...');

      // Navigate to login page
      await this.page.goto('https://www.tickpick.com/login', {
        waitUntil: 'networkidle'
      });

      // Fill login form
      await this.page.fill('input[type="email"]', this.credentials.email);
      await this.page.fill('input[type="password"]', this.credentials.password);

      // Click login button
      await this.page.click('button[type="submit"]');

      // Wait for redirect or login success
      await this.page.waitForURL(/^((?!login).)*$/, { timeout: 10000 });

      console.log('Login successful');

      // Save storage state for faster future logins
      if (process.env.NODE_ENV !== 'production') {
        const storageState = await this.page.context().storageState();
        // Save to file or environment for reuse
      }

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Failed to login to TickPick');
    }
  }

  async purchaseTickets(details: PurchaseDetails): Promise<PurchaseResult> {
    if (!this.page) {
      await this.initialize();
    }

    // Create purchase attempt record
    const attempt = await prisma.purchaseAttempt.create({
      data: {
        ticketId: details.ticketId,
        userId: details.userId,
        status: 'pending'
      }
    });

    try {
      // Navigate to event page
      console.log(`Navigating to event: ${details.gameUrl}`);
      await this.page!.goto(details.gameUrl, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for listings to load
      await this.page!.waitForTimeout(3000);

      // Find the specific ticket listing
      const found = await this.selectTickets(details);

      if (!found) {
        throw new Error(`Could not find tickets for Section ${details.section}, Row ${details.row}`);
      }

      // Proceed to checkout
      const result = await this.completeCheckout(details);

      // Update purchase attempt
      await prisma.purchaseAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'success',
          confirmationCode: result.confirmationCode,
          purchasePrice: result.purchasePrice,
          ticketFile: result.ticketFile,
          completedAt: new Date()
        }
      });

      return result;

    } catch (error: any) {
      console.error('Purchase failed:', error);

      // Update purchase attempt with error
      await prisma.purchaseAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date()
        }
      });

      return {
        success: false,
        errorMessage: error.message
      };
    }
  }

  private async selectTickets(details: PurchaseDetails): Promise<boolean> {
    if (!this.page) return false;

    try {
      // Try multiple strategies to find the tickets

      // Strategy 1: Look for exact section/row match
      const sectionRowSelector = `[data-section="${details.section}"][data-row="${details.row}"]`;
      let element = await this.page.$(sectionRowSelector);

      if (!element) {
        // Strategy 2: Look for text content
        const locator = this.page.locator(
          `text=/Section ${details.section}.*Row ${details.row}/i`
        );
        const count = await locator.count();
        if (count > 0) {
          element = await locator.first().elementHandle();
        }
      }

      if (!element) {
        // Strategy 3: Find all listings and filter
        const listings = await this.page.$$('[class*="listing"]');

        for (const listing of listings) {
          const text = await listing.textContent();
          if (text?.includes(`Section ${details.section}`) &&
              text?.includes(`Row ${details.row}`)) {
            element = listing;
            break;
          }
        }
      }

      if (element) {
        // Click on the listing
        await element.click();

        // Wait for selection confirmation
        await this.page.waitForTimeout(1000);

        // Look for "Buy" or "Checkout" button
        const buyButton = await this.page.locator(
          'button:has-text("Buy"), button:has-text("Checkout"), button:has-text("Continue")'
        ).first();

        if (buyButton) {
          await buyButton.click();
          return true;
        }
      }

      return false;

    } catch (error) {
      console.error('Error selecting tickets:', error);
      return false;
    }
  }

  private async completeCheckout(details: PurchaseDetails): Promise<PurchaseResult> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      // Wait for checkout page
      await this.page.waitForURL(/checkout|cart|payment/, { timeout: 10000 });

      // Check if login is required
      const needsLogin = await this.page.$('input[type="email"]');
      if (needsLogin) {
        await this.login();
      }

      // Fill any required fields (name, phone, etc.)
      const nameField = await this.page.$('input[name="name"], input[name="fullName"]');
      if (nameField) {
        await nameField.fill('SeatJumper Winner');
      }

      // Look for saved payment method or enter new one
      const savedPayment = await this.page.$('[data-testid="saved-payment"]');

      if (!savedPayment) {
        // Enter payment details if needed
        // In production, these would come from secure storage
        console.log('Payment method required - manual intervention needed');

        // For MVP, could pause here for manual entry
        if (process.env.NODE_ENV !== 'production') {
          console.log('Waiting for manual payment entry...');
          await this.page.waitForTimeout(30000); // 30 seconds for manual entry
        }
      }

      // Extract final price
      const priceElement = await this.page.$('[class*="total"], [class*="price"]');
      const priceText = await priceElement?.textContent();
      const purchasePrice = parseFloat(priceText?.replace(/[^0-9.]/g, '') || '0');

      // Complete purchase
      const purchaseButton = await this.page.locator(
        'button:has-text("Complete Purchase"), button:has-text("Place Order"), button:has-text("Buy Now")'
      ).first();

      if (purchaseButton) {
        await purchaseButton.click();

        // Wait for confirmation
        await this.page.waitForURL(/confirmation|success|order/, { timeout: 30000 });

        // Extract confirmation number
        const confirmationElement = await this.page.$(
          '[class*="confirmation"], [class*="order-number"], [class*="receipt"]'
        );
        const confirmationCode = await confirmationElement?.textContent();

        // Try to download tickets
        const downloadButton = await this.page.$('a:has-text("Download"), button:has-text("Download")');
        let ticketFile: string | undefined;

        if (downloadButton) {
          const downloadPromise = this.page.waitForEvent('download');
          await downloadButton.click();
          const download = await downloadPromise;

          // Save the download
          const fileName = `tickets_${Date.now()}.pdf`;
          const filePath = `./downloads/${fileName}`;
          await download.saveAs(filePath);
          ticketFile = filePath;
        }

        return {
          success: true,
          confirmationCode: confirmationCode || `TICK-${Date.now()}`,
          purchasePrice,
          ticketFile
        };
      }

      throw new Error('Could not find purchase button');

    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

// Helper function to purchase tickets for a winner
export async function purchaseTicketsForWinner(
  userId: string,
  ticketId: string,
  gameUrl: string
): Promise<PurchaseResult> {
  const buyer = new TickPickBuyer();

  try {
    // Get ticket details from database
    const ticket = await prisma.scrapedTicket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new Error('Ticket not found in database');
    }

    await buyer.initialize();

    const result = await buyer.purchaseTickets({
      ticketId,
      userId,
      gameUrl,
      section: ticket.section,
      row: ticket.row,
      quantity: ticket.quantity,
      maxPrice: ticket.price * 1.1 // Allow 10% price increase
    });

    return result;

  } finally {
    await buyer.close();
  }
}

// Function to setup credentials (run once during setup)
export async function setupTickPickCredentials(email: string, password: string) {
  // Simple encryption (use proper encryption in production)
  const encryptedPwd = Buffer.from(password).toString('base64');

  await prisma.tickPickCredential.create({
    data: {
      email,
      encryptedPwd,
      isActive: true
    }
  });

  console.log('TickPick credentials saved');
}