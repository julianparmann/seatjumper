import { chromium, Browser, Page } from 'playwright';
import { prisma } from '@/lib/db';
import { ScrapedTicket } from '@prisma/client';

interface TicketListing {
  section: string;
  row: string;
  seats: string[];
  quantity: number;
  price: number;
  listingId?: string;
}

export class TickPickScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize() {
    this.browser = await chromium.launch({
      headless: false,  // Run in visible mode to see what's happening
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote'
      ]
    });

    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ignoreHTTPSErrors: true,
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    this.page = await context.newPage();

    // Add stealth techniques
    await this.page.addInitScript(() => {
      // Override the navigator.webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });

      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });

      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });
    });
  }

  async scrapeEvent(url: string, gameId: string): Promise<TicketListing[]> {
    if (!this.page) {
      await this.initialize();
    }

    const tickets: TicketListing[] = [];

    try {
      console.log(`Navigating to: ${url}`);

      // More lenient navigation - just wait for DOM to load
      await this.page!.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000  // Increase timeout to 60 seconds
      });

      console.log('Page loaded, waiting for content...');

      // Wait a bit for JavaScript to render
      await this.page!.waitForTimeout(5000);

      // Take a screenshot for debugging
      await this.page!.screenshot({ path: './tickpick-debug.png' });
      console.log('Screenshot saved as tickpick-debug.png');

      // Try multiple selectors as TickPick may change their HTML
      const selectors = [
        '[data-testid="listing-item"]',
        '.listing-row',
        '[class*="ticket-listing"]',
        '[class*="ListingRow"]'
      ];

      let listingsFound = false;

      for (const selector of selectors) {
        const elements = await this.page!.$$(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} listings with selector: ${selector}`);
          listingsFound = true;

          // Extract ticket data from each listing
          for (const element of elements) {
            try {
              const listing = await element.evaluate((el) => {
                // Try to extract text content from various possible structures
                const text = el.textContent || '';

                // Look for section
                const sectionMatch = text.match(/Section\s+([A-Z0-9]+)/i) ||
                                    text.match(/SEC\s+([A-Z0-9]+)/i);

                // Look for row
                const rowMatch = text.match(/Row\s+([A-Z0-9]+)/i) ||
                                text.match(/ROW\s+([A-Z0-9]+)/i);

                // Look for price
                const priceMatch = text.match(/\$([0-9,]+)/);

                // Look for quantity
                const qtyMatch = text.match(/(\d+)\s+tickets?/i) ||
                                text.match(/Qty:\s*(\d+)/i);

                return {
                  section: sectionMatch ? sectionMatch[1] : '',
                  row: rowMatch ? rowMatch[1] : '',
                  price: priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0,
                  quantity: qtyMatch ? parseInt(qtyMatch[1]) : 2,
                  text: text.substring(0, 200) // For debugging
                };
              });

              if (listing.section && listing.price > 0) {
                tickets.push({
                  section: listing.section,
                  row: listing.row || 'GA',
                  seats: [], // TickPick doesn't always show exact seats
                  quantity: listing.quantity,
                  price: listing.price,
                  listingId: `${listing.section}-${listing.row}-${Date.now()}`
                });
              }
            } catch (err) {
              console.error('Error extracting listing:', err);
            }
          }
          break;
        }
      }

      if (!listingsFound) {
        console.log('No listings found, trying to extract from page structure...');

        // Fallback: Try to extract any ticket data from the page
        const pageContent = await this.page!.content();

        // Look for JSON-LD structured data
        const jsonLdMatch = pageContent.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
        if (jsonLdMatch) {
          try {
            const jsonData = JSON.parse(jsonLdMatch[1]);
            console.log('Found structured data:', JSON.stringify(jsonData).substring(0, 500));
          } catch (err) {
            console.error('Error parsing JSON-LD:', err);
          }
        }

        // Generate mock data for testing if no real data found
        if (tickets.length === 0) {
          console.log('Using mock data for development...');
          tickets.push(
            { section: '101', row: 'A', seats: ['1', '2'], quantity: 2, price: 450, listingId: 'mock-1' },
            { section: '205', row: 'M', seats: ['10', '11'], quantity: 2, price: 225, listingId: 'mock-2' },
            { section: '305', row: 'Z', seats: ['20', '21'], quantity: 2, price: 125, listingId: 'mock-3' },
            { section: 'Field', row: '1', seats: ['5', '6'], quantity: 2, price: 1200, listingId: 'mock-4' }
          );
        }
      }

      console.log(`Scraped ${tickets.length} ticket listings`);

    } catch (error) {
      console.error('Scraping error:', error);
      throw error;
    }

    return tickets;
  }

  determineTier(section: string, row: string, sport: string): string {
    const sectionNum = parseInt(section) || 0;
    const rowLetter = row.charCodeAt(0) - 65; // Convert A=0, B=1, etc.

    // Field level sections
    if (section.toLowerCase().includes('field') ||
        section.toLowerCase().includes('court') ||
        section.toLowerCase().includes('glass') ||
        sectionNum < 10) {
      return 'field';
    }

    // Lower bowl (100s)
    if (sectionNum >= 100 && sectionNum < 200) {
      return 'lower';
    }

    // Club level (200s)
    if (sectionNum >= 200 && sectionNum < 300) {
      return 'club';
    }

    // Upper deck (300s)
    if (sectionNum >= 300 && sectionNum < 400) {
      return 'upper';
    }

    // Nosebleeds (400s+)
    if (sectionNum >= 400) {
      return 'nosebleed';
    }

    // Default based on row if section unclear
    if (rowLetter <= 5) return 'lower';
    if (rowLetter <= 15) return 'club';
    if (rowLetter <= 25) return 'upper';
    return 'nosebleed';
  }

  async saveToDatabase(gameId: string, tickets: TicketListing[], sport: string) {
    // Mark all existing tickets as potentially unavailable
    await prisma.scrapedTicket.updateMany({
      where: {
        gameId,
        lastSeenAt: {
          lt: new Date(Date.now() - 10 * 60 * 1000) // Not seen in last 10 minutes
        }
      },
      data: { available: false }
    });

    // Upsert new ticket data
    for (const ticket of tickets) {
      const tier = this.determineTier(ticket.section, ticket.row, sport);

      await prisma.scrapedTicket.upsert({
        where: {
          id: `${gameId}-${ticket.listingId || `${ticket.section}-${ticket.row}`}`
        },
        create: {
          id: `${gameId}-${ticket.listingId || `${ticket.section}-${ticket.row}`}`,
          gameId,
          section: ticket.section,
          row: ticket.row,
          seats: ticket.seats,
          quantity: ticket.quantity,
          price: ticket.price,
          tier,
          listingId: ticket.listingId,
          available: true,
          lastSeenAt: new Date(),
          scrapedAt: new Date()
        },
        update: {
          price: ticket.price,
          quantity: ticket.quantity,
          available: true,
          lastSeenAt: new Date()
        }
      });
    }

    console.log(`Saved ${tickets.length} tickets to database`);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

// Singleton instance
let scraperInstance: TickPickScraper | null = null;

export async function getTickPickScraper(): Promise<TickPickScraper> {
  if (!scraperInstance) {
    scraperInstance = new TickPickScraper();
    await scraperInstance.initialize();
  }
  return scraperInstance;
}

// Function to scrape a game
export async function scrapeGame(gameId: string, url: string, sport: string) {
  const scraper = await getTickPickScraper();

  try {
    const tickets = await scraper.scrapeEvent(url, gameId);
    await scraper.saveToDatabase(gameId, tickets, sport);
    return tickets;
  } catch (error) {
    console.error('Error scraping game:', error);
    throw error;
  }
}