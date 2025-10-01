import { chromium, Browser, Page } from 'playwright';

export interface LaytonBreakTeam {
  teamName: string;
  price: number;
  available: boolean;
}

export interface LaytonBreakData {
  title: string;
  productType: string;
  teams: LaytonBreakTeam[];
  url: string;
  availableTeams: number;
  totalValue: number;
  availableValue: number;
  averagePrice: number;
}

export class LaytonBreaksScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true
      });
      this.page = await this.browser.newPage();
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  async scrapeBreakPage(url: string): Promise<LaytonBreakData> {
    if (!this.page) {
      await this.init();
    }

    try {

      await this.page!.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      // Wait for JavaScript to load
      await this.page!.waitForTimeout(5000);

      // Extract the title
      const title = await this.page!.$eval(
        'h1, .product__title, .product-single__title, .product-title, .product_name, .product-meta__title',
        el => el.textContent?.trim() || ''
      ).catch(() => 'Unknown Product');


      // Extract teams and prices
      const teamsData = await this.page!.evaluate(() => {
        // Step 1: Get available teams from the product select dropdown
        const productSelect = document.getElementById('ProductSelect-product-variant-show-stock') as HTMLSelectElement;
        const availableTeamNames: string[] = [];

        if (productSelect) {
          Array.from(productSelect.options).forEach(opt => {
            const text = opt.textContent?.trim() || '';
            if (text && text !== '---' && !text.toLowerCase().includes('select')) {
              // If it doesn't say "Sold out", it's available
              if (!text.includes('Sold out')) {
                const teamName = text.trim();
                availableTeamNames.push(teamName);
              }
            }
          });
        }

        // Step 2: Extract prices from JavaScript data
        const priceData: { [key: string]: number } = {};

        // Look through all scripts for variant data
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
          const content = script.textContent || '';

          // Look for variant data with prices
          const variantMatches = content.matchAll(/["']title["']:\s*["']([^"']+)["'][^}]*["']price["']:\s*(\d+)/g);
          for (const match of variantMatches) {
            const title = match[1];
            const price = parseInt(match[2]) / 100; // Convert cents to dollars
            priceData[title] = price;
          }
        }

        // Step 3: Combine available teams with their prices
        const teams: LaytonBreakTeam[] = [];
        availableTeamNames.forEach(teamName => {
          const price = priceData[teamName];
          if (price && price > 0) {
            teams.push({
              teamName,
              price,
              available: true
            });
          }
        });

        return teams;
      });

      teamsData.forEach(team => {
      });

      // Calculate summary
      const availableTeams = teamsData.length;
      const totalValue = teamsData.reduce((sum, t) => sum + t.price, 0);
      const availableValue = totalValue; // All teams in our list are available
      const averagePrice = availableTeams > 0 ? availableValue / availableTeams : 0;

      // Determine product type
      let productType = 'Unknown';
      if (title.toLowerCase().includes('football')) productType = 'Football';
      else if (title.toLowerCase().includes('basketball')) productType = 'Basketball';
      else if (title.toLowerCase().includes('baseball')) productType = 'Baseball';
      else if (title.toLowerCase().includes('hockey')) productType = 'Hockey';


      return {
        title,
        productType,
        teams: teamsData,
        url,
        availableTeams,
        totalValue,
        availableValue,
        averagePrice
      };
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      throw error;
    }
  }

  async scrapeMultipleBreaks(urls: string[]): Promise<LaytonBreakData[]> {
    const results: LaytonBreakData[] = [];

    for (const url of urls) {
      try {
        const data = await this.scrapeBreakPage(url);
        results.push(data);
      } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
      }
    }

    return results;
  }
}

export function calculateBreakInventory(breaks: LaytonBreakData[]) {
  const totalBreaks = breaks.reduce((sum, b) => sum + b.teams.length, 0);
  const availableBreaks = breaks.reduce((sum, b) => sum + b.availableTeams, 0);
  const totalValue = breaks.reduce((sum, b) => sum + b.totalValue, 0);
  const availableValue = breaks.reduce((sum, b) => sum + b.availableValue, 0);
  const averageSpotPrice = availableBreaks > 0 ? availableValue / availableBreaks : 0;

  // Calculate customer price with margin
  const marginMultiplier = 1.35; // 35% margin
  const customerPrice = averageSpotPrice * marginMultiplier;

  return {
    totalBreaks,
    availableBreaks,
    totalValue,
    availableValue,
    averageSpotPrice,
    customerPrice
  };
}