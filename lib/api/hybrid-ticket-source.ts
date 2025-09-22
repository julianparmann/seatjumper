// Hybrid Ticket Data Source
// Combines multiple approaches to ensure we always have data

export interface TicketListing {
  section: string;
  row: string;
  seats: number;
  price: number;
  tier: 'field' | 'lower' | 'club' | 'upper' | 'nosebleed';
}

export class HybridTicketSource {

  // Method 1: Generate realistic mock data based on venue
  generateRealisticTickets(venue: string, sport: string): TicketListing[] {
    const tickets: TicketListing[] = [];

    // Field/Court level
    for (let i = 1; i <= 10; i++) {
      tickets.push({
        section: i.toString(),
        row: String.fromCharCode(65 + Math.floor(Math.random() * 5)), // A-E
        seats: 2,
        price: 800 + Math.random() * 700,
        tier: 'field'
      });
    }

    // Lower bowl
    for (let i = 101; i <= 130; i += 3) {
      tickets.push({
        section: i.toString(),
        row: String.fromCharCode(65 + Math.floor(Math.random() * 10)), // A-J
        seats: 2 + Math.floor(Math.random() * 3),
        price: 300 + Math.random() * 300,
        tier: 'lower'
      });
    }

    // Club level
    for (let i = 201; i <= 230; i += 5) {
      tickets.push({
        section: i.toString(),
        row: String.fromCharCode(65 + Math.floor(Math.random() * 8)), // A-H
        seats: 2,
        price: 400 + Math.random() * 350,
        tier: 'club'
      });
    }

    // Upper deck
    for (let i = 301; i <= 350; i += 7) {
      tickets.push({
        section: i.toString(),
        row: String.fromCharCode(65 + Math.floor(Math.random() * 20)), // A-T
        seats: 2 + Math.floor(Math.random() * 4),
        price: 100 + Math.random() * 150,
        tier: 'upper'
      });
    }

    // Nosebleeds
    for (let i = 401; i <= 430; i += 10) {
      tickets.push({
        section: i.toString(),
        row: String.fromCharCode(85 + Math.floor(Math.random() * 5)), // U-Z
        seats: 2 + Math.floor(Math.random() * 6),
        price: 50 + Math.random() * 100,
        tier: 'nosebleed'
      });
    }

    return tickets;
  }

  // Method 2: Use manual data entry
  async getManualTickets(gameId: string): Promise<TicketListing[]> {
    // In production, this would fetch from your database
    // where admins have manually entered ticket prices
    return [];
  }

  // Method 3: Try proxy service (if you have one)
  async getProxyTickets(url: string): Promise<TicketListing[]> {
    // If you sign up for ScraperAPI or similar
    if (process.env.SCRAPER_API_KEY) {
      try {
        const proxyUrl = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        // Parse and return tickets
        return [];
      } catch (error) {
      }
    }
    return [];
  }

  // Main method: Get tickets from best available source
  async getTickets(options: {
    url?: string;
    venue: string;
    sport: string;
    gameId?: string;
  }): Promise<{
    tickets: TicketListing[];
    source: 'real' | 'manual' | 'generated';
    confidence: number;
  }> {

    // Try real data first (if proxy available)
    if (options.url && process.env.SCRAPER_API_KEY) {
      const proxyTickets = await this.getProxyTickets(options.url);
      if (proxyTickets.length > 0) {
        return {
          tickets: proxyTickets,
          source: 'real',
          confidence: 1.0
        };
      }
    }

    // Try manual data
    if (options.gameId) {
      const manualTickets = await this.getManualTickets(options.gameId);
      if (manualTickets.length > 0) {
        return {
          tickets: manualTickets,
          source: 'manual',
          confidence: 0.9
        };
      }
    }

    // Fallback to realistic generated data
    const generatedTickets = this.generateRealisticTickets(options.venue, options.sport);

    // Add some variance to make it more realistic
    const variance = 0.15; // 15% price variance
    const adjustedTickets = generatedTickets.map(ticket => ({
      ...ticket,
      price: Math.round(ticket.price * (1 + (Math.random() - 0.5) * variance))
    }));

    return {
      tickets: adjustedTickets,
      source: 'generated',
      confidence: 0.7
    };
  }
}

// Helper to get ticket stats
export function getTicketStats(tickets: TicketListing[]) {
  const prices = tickets.map(t => t.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    median: prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)],
    count: tickets.length,
    byTier: {
      field: tickets.filter(t => t.tier === 'field').length,
      lower: tickets.filter(t => t.tier === 'lower').length,
      club: tickets.filter(t => t.tier === 'club').length,
      upper: tickets.filter(t => t.tier === 'upper').length,
      nosebleed: tickets.filter(t => t.tier === 'nosebleed').length,
    }
  };
}