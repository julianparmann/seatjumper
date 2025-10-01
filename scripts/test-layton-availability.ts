import { chromium } from 'playwright';

async function testLaytonAvailability() {
  const url = 'https://laytonsportscards.com/collections/live-breaks/products/2025-panini-donruss-football-hobby-box-6-box-break-2-pick-your-team';

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Loading page...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);

    const data = await page.evaluate(() => {
      // Get teams from the second dropdown (has "Sold out" indicators)
      const productSelect = document.getElementById('ProductSelect-product-variant-show-stock') as HTMLSelectElement;
      const availableTeams: string[] = [];
      const soldOutTeams: string[] = [];

      if (productSelect) {
        Array.from(productSelect.options).forEach(opt => {
          const text = opt.textContent?.trim() || '';
          if (text && text !== '---' && !text.toLowerCase().includes('select')) {
            const teamName = text.replace(' - Sold out', '').trim();
            if (text.includes('Sold out')) {
              soldOutTeams.push(teamName);
            } else {
              availableTeams.push(teamName);
            }
          }
        });
      }

      // Now find prices from page data
      const priceData: { [key: string]: number } = {};

      // Method 1: Check meta tags for variant data
      const metaTags = document.querySelectorAll('meta[property^="product:"]');
      metaTags.forEach(meta => {
        const content = meta.getAttribute('content');
        if (content && content.includes('variant')) {
          console.log('Found meta:', content);
        }
      });

      // Method 2: Look for JavaScript variables
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const script of scripts) {
        const content = script.textContent || '';

        // Look for theme object with product data
        if (content.includes('theme.moneyFormat') || content.includes('theme.product')) {
          const priceMatch = content.match(/price["':]\s*(\d+)/g);
          if (priceMatch) {
            console.log('Found prices in theme:', priceMatch);
          }
        }

        // Look for specific variant data
        const variantMatches = content.matchAll(/["']title["']:\s*["']([^"']+)["'][^}]*["']price["']:\s*(\d+)/g);
        for (const match of variantMatches) {
          const title = match[1];
          const price = parseInt(match[2]) / 100; // Convert cents to dollars
          priceData[title] = price;
        }
      }

      // Method 3: Check for Shopify's variant data
      const shopifyData = (window as any).ShopifyAnalytics?.meta?.product;
      if (shopifyData && shopifyData.variants) {
        shopifyData.variants.forEach((v: any) => {
          if (v.name && v.price) {
            priceData[v.name] = v.price / 100;
          }
        });
      }

      return {
        availableTeams,
        soldOutTeams,
        priceData,
        totalOptions: productSelect?.options.length || 0
      };
    });

    console.log('\n=== AVAILABILITY RESULTS ===\n');
    console.log(`Total options in dropdown: ${data.totalOptions}`);
    console.log(`Available teams: ${data.availableTeams.length}`);
    console.log(`Sold out teams: ${data.soldOutTeams.length}`);

    console.log('\n=== AVAILABLE TEAMS ===');
    data.availableTeams.forEach(team => {
      const price = data.priceData[team];
      console.log(`  ✓ ${team}${price ? ` - $${price}` : ' (price not found)'}`);
    });

    console.log('\n=== SOLD OUT TEAMS ===');
    data.soldOutTeams.slice(0, 5).forEach(team => {
      console.log(`  ✗ ${team}`);
    });
    if (data.soldOutTeams.length > 5) {
      console.log(`  ... and ${data.soldOutTeams.length - 5} more`);
    }

    console.log('\n=== PRICE DATA FOUND ===');
    console.log(`Total prices found: ${Object.keys(data.priceData).length}`);
    if (Object.keys(data.priceData).length > 0) {
      Object.entries(data.priceData).slice(0, 5).forEach(([team, price]) => {
        console.log(`  ${team}: $${price}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testLaytonAvailability();