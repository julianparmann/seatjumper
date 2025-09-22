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


      // Extract teams using combined approach
      const teamsData = await this.page!.evaluate(() => {
        // Get available teams from dropdown (those without "Sold out")
        const availableTeams = new Set<string>();
        const selects = document.querySelectorAll('select');

        selects.forEach(select => {
          const options = Array.from(select.options);
          options.forEach(opt => {
            const text = opt.textContent?.trim() || '';
            // Skip if sold out or placeholder
            if (!text.toLowerCase().includes('sold out') &&
                !text.toLowerCase().includes('select') &&
                !text.toLowerCase().includes('choose') &&
                text.length > 0 &&
                text !== '---') {
              // Extract just team name (remove any price or extra text)
              const teamName = text.replace(/\s*-\s*\$\d+.*$/, '').trim();
              if (teamName) {
                availableTeams.add(teamName);
              }
            }
          });
        });


        // Now get prices from JavaScript data
        const teams: any[] = [];

        // Look for product variants in various places
        const scripts = document.querySelectorAll('script');
        let productData: any = null;

        scripts.forEach(script => {
          const content = script.textContent || '';

          // Look for product data
          if (content.includes('product:') || content.includes('variants:')) {
            try {
              // Try to extract JSON data
              const variantMatch = content.match(/variants\s*:\s*(\[[\s\S]*?\])/);
              if (variantMatch) {
                const variantsJson = variantMatch[1]
                  .replace(/(\w+):/g, '"$1":')
                  .replace(/'/g, '"')
                  .replace(/,\s*}/, '}')
                  .replace(/,\s*\]/, ']');

                const variants = JSON.parse(variantsJson);
                productData = { variants };
              }
            } catch (e) {
              // Try another method
            }
          }

          // Also look for window.productVariants or similar
          if (content.includes('productVariants') || content.includes('product_variants')) {
            const match = content.match(/(?:productVariants|product_variants)\s*=\s*(\[[\s\S]*?\]);/);
            if (match) {
              try {
                productData = { variants: JSON.parse(match[1]) };
              } catch (e) {
                // Ignore
              }
            }
          }
        });

        // Also check for global variables
        if (!productData && (window as any).product) {
          productData = (window as any).product;
        }
        if (!productData && (window as any).productVariants) {
          productData = { variants: (window as any).productVariants };
        }

        // Process variants if found
        if (productData && productData.variants) {
          productData.variants.forEach((variant: any) => {
            const variantTitle = variant.title || variant.name || variant.option1 || '';
            const price = variant.price ? variant.price / 100 : 0; // Prices often in cents

            // Only add if this team is available (in our availableTeams set)
            if (variantTitle && price > 0) {
              // Check if this team name matches any available team
              const isAvailable = Array.from(availableTeams).some(availTeam =>
                variantTitle.toLowerCase().includes(availTeam.toLowerCase()) ||
                availTeam.toLowerCase().includes(variantTitle.toLowerCase())
              );

              if (isAvailable) {
                teams.push({
                  teamName: variantTitle,
                  price: price,
                  available: true
                });
              }
            }
          });
        }

        return {
          availableTeamNames: Array.from(availableTeams),
          teamsWithPrices: teams
        };
      });


      let teams = teamsData.teamsWithPrices;

      // If we didn't find prices in JavaScript, create entries with estimated prices
      if (teams.length === 0 && teamsData.availableTeamNames.length > 0) {
        // We can't determine prices, so we'll need to handle this differently
        // For now, return empty as we can't determine actual prices
        teams = [];
      }

      // Calculate summary
      const availableTeams = teams.filter(t => t.available).length;
      const totalValue = teams.reduce((sum, t) => sum + t.price, 0);
      const availableValue = teams.filter(t => t.available).reduce((sum, t) => sum + t.price, 0);
      const averagePrice = availableTeams > 0 ? availableValue / availableTeams : 0;

      // Determine product type
      let productType = 'Unknown';
      if (title.toLowerCase().includes('football')) productType = 'Football';
      else if (title.toLowerCase().includes('basketball')) productType = 'Basketball';
      else if (title.toLowerCase().includes('baseball')) productType = 'Baseball';
      else if (title.toLowerCase().includes('hockey')) productType = 'Hockey';


      // Log the actual teams found
      teams.forEach(team => {
      });

      return {
        title,
        productType,
        teams,
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