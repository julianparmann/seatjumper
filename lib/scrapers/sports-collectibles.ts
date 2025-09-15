import { chromium, Browser, Page } from 'playwright';

export interface CollectibleItem {
  name: string;
  price: number;
  available: boolean;
  imageUrl?: string;
  description?: string;
  category?: string;
}

export interface CollectiblesPageData {
  title: string;
  items: CollectibleItem[];
  url: string;
  totalItems: number;
  availableItems: number;
  totalValue: number;
  averagePrice: number;
}

export class SportsCollectiblesScraper {
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

  async scrapeCollectiblesPage(url: string): Promise<CollectiblesPageData> {
    if (!this.page) {
      await this.init();
    }

    try {
      console.log(`Scraping Sports Collectibles: ${url}`);

      // Navigate with longer timeout
      await this.page!.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      console.log('Page loaded, waiting for products to appear...');

      // Wait longer for dynamic content to load
      await this.page!.waitForTimeout(5000);

      // Try to wait for product selectors with longer timeout
      await this.page!.waitForSelector('.v65-productDisplay-cell, .v65-productDisplay-row, .v-product', {
        timeout: 15000,
        state: 'attached'
      }).catch(() => {
        console.log('Product selector not found after 15s, continuing anyway...');
      });

      // Additional wait to ensure prices load
      await this.page!.waitForTimeout(2000);

      // Extract page title
      const title = await this.page!.$eval(
        'h1, .page_heading, .category-header h1',
        el => el.textContent?.trim() || ''
      ).catch(() => 'Sports Collectibles');

      console.log(`Page Title: ${title}`);

      // Extract all items on the page - handle both new and old site structures
      const items = await this.page!.evaluate(() => {
        const collectibles: any[] = [];

        // Method 1: Try v65 structure first (.v65-productDisplay-cell)
        let cells = document.querySelectorAll('.v65-productDisplay-cell');

        if (cells.length > 0) {
          cells.forEach(cell => {
            try {
              const link = cell.querySelector('a[href*=".htm"]');
              const img = cell.querySelector('img');
              const textContent = cell.textContent || '';

              // Extract name
              const name = link?.getAttribute('title') || img?.getAttribute('alt') || '';

              // Extract price from text content
              const priceMatch = textContent.match(/\$[\d,]+\.?\d*/);
              const price = priceMatch ? parseFloat(priceMatch[0].replace(/[$,]/g, '')) : 0;

              // Get image URL
              let imageUrl = img?.getAttribute('src') || '';
              if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = new URL(imageUrl, window.location.origin).href;
              }

              // Check availability
              const available = !textContent.toLowerCase().includes('sold out') &&
                              !textContent.toLowerCase().includes('unavailable');

              if (name && price > 0) {
                collectibles.push({
                  name,
                  price,
                  available,
                  imageUrl,
                  description: name // Use name as description if no other description found
                });
              }
            } catch (err) {
              console.error('Error parsing cell:', err);
            }
          });
        }

        // Method 2: If no cells found, try finding product links with images
        if (collectibles.length === 0) {
          const productLinks = document.querySelectorAll('a[href*="_p"][href*=".htm"]');
          productLinks.forEach(link => {
            try {
              const img = link.querySelector('img');
              if (img) {
                const parent = link.closest('td, div');
                const text = parent ? parent.textContent : '';
                const priceMatch = text?.match(/\$[\d,]+\.?\d*/);

                if (priceMatch) {
                  const name = link.getAttribute('title') || img.getAttribute('alt') || 'Product';
                  let imageUrl = img.getAttribute('src') || '';
                  if (imageUrl && !imageUrl.startsWith('http')) {
                    imageUrl = new URL(imageUrl, window.location.origin).href;
                  }

                  const price = parseFloat(priceMatch[0].replace(/[$,]/g, ''));
                  const available = !text.toLowerCase().includes('sold out');

                  collectibles.push({
                    name,
                    price,
                    available,
                    imageUrl,
                    description: name
                  });
                }
              }
            } catch (err) {
              console.error('Error parsing product link:', err);
            }
          });
        }

        // Method 3: Fallback to old structure (.v-product) if still no products
        if (collectibles.length === 0) {
          const productElements = document.querySelectorAll('.v-product');
          productElements.forEach((product) => {
            try {
              // Get product name
              const nameElement = product.querySelector('.v-product__title a, .product_name a, .product-title a');
              const name = nameElement?.textContent?.trim() || '';

              // Get product price
              const priceElement = product.querySelector('.product_productprice, .product-price, .price');
              let price = 0;
              if (priceElement) {
                const priceText = priceElement.textContent || '';
                // Extract numeric value from price text
                const priceMatch = priceText.match(/[\d,]+\.?\d*/);
                if (priceMatch) {
                  price = parseFloat(priceMatch[0].replace(',', ''));
                }
              }

              // Get product image
              const imageElement = product.querySelector('img.v-product__img, img.product-image, .product_photo img') as HTMLImageElement;
              let imageUrl = '';
              if (imageElement) {
                imageUrl = imageElement.src || imageElement.dataset.src || '';
                // Make sure it's a full URL
                if (imageUrl && !imageUrl.startsWith('http')) {
                  imageUrl = new URL(imageUrl, window.location.origin).href;
                }
              }

              // Check availability (if "Out of Stock" text exists)
              const outOfStockElement = product.querySelector('.out-of-stock, .sold-out, .unavailable');
              const addToCartButton = product.querySelector('.add-to-cart, .btn-add-to-cart, button[value*="Add"]');
              const available = !outOfStockElement && !!addToCartButton;

              // Get product description if available
              const descElement = product.querySelector('.product-description, .product-desc, .v-product__desc');
              const description = descElement?.textContent?.trim() || '';

              if (name && price > 0) {
                collectibles.push({
                  name,
                  price,
                  available,
                  imageUrl,
                  description
                });
              }
            } catch (err) {
              console.error('Error parsing product:', err);
            }
          });
        }

        return collectibles;
      });

      console.log(`Found ${items.length} items`);

      // If no items found, log page info for debugging
      if (items.length === 0) {
        const debugInfo = await this.page!.evaluate(() => {
          return {
            title: document.title,
            hasV65Cells: document.querySelectorAll('.v65-productDisplay-cell').length,
            hasProductLinks: document.querySelectorAll('a[href*="_p"][href*=".htm"]').length,
            hasImages: document.querySelectorAll('img').length,
            hasPrices: (document.body?.textContent || '').includes('$'),
            bodyLength: document.body?.innerHTML.length || 0,
            sampleHTML: document.body?.innerHTML.substring(1000, 2000) || ''
          };
        });
        console.log('Debug info - no products found:', debugInfo);
      }

      // Calculate statistics
      const availableItems = items.filter(item => item.available);
      const totalValue = items.reduce((sum, item) => sum + item.price, 0);
      const averagePrice = items.length > 0 ? totalValue / items.length : 0;

      return {
        title,
        items,
        url,
        totalItems: items.length,
        availableItems: availableItems.length,
        totalValue,
        averagePrice
      };
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      // Return empty result instead of throwing
      return {
        title: 'Error loading page',
        items: [],
        url,
        totalItems: 0,
        availableItems: 0,
        totalValue: 0,
        averagePrice: 0
      };
    }
  }

  async scrapeMultiplePages(urls: string[]): Promise<CollectiblesPageData[]> {
    const results: CollectiblesPageData[] = [];

    for (const url of urls) {
      try {
        const data = await this.scrapeCollectiblesPage(url);
        results.push(data);
      } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
      }
    }

    return results;
  }
}

export function calculateMemorabiliaTotals(pages: CollectiblesPageData[]) {
  const allItems = pages.flatMap(page => page.items);
  const availableItems = allItems.filter(item => item.available);

  return {
    totalItems: allItems.length,
    availableItems: availableItems.length,
    totalValue: allItems.reduce((sum, item) => sum + item.price, 0),
    averagePrice: allItems.length > 0
      ? allItems.reduce((sum, item) => sum + item.price, 0) / allItems.length
      : 0,
    itemsByPrice: allItems.sort((a, b) => b.price - a.price)
  };
}