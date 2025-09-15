const { chromium } = require('playwright');

async function testScraper() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Testing Sports Collectibles scraper...');
    await page.goto('https://www.sportscollectibles.com/autographed_trading_cards_c9931.htm', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for any dynamic content
    await page.waitForTimeout(2000);

    // Try the scraper logic
    const products = await page.evaluate(() => {
      const items = [];

      // Method 1: Look for v65 product display cells
      let cells = document.querySelectorAll('.v65-productDisplay-cell');
      console.log('Found cells:', cells.length);

      if (cells.length === 0) {
        // Method 2: Find product links with images
        const productLinks = document.querySelectorAll('a[href*="_p"][href*=".htm"]:has(img)');
        console.log('Found product links:', productLinks.length);

        productLinks.forEach(link => {
          const img = link.querySelector('img');
          const parent = link.closest('td, div');
          const text = parent ? parent.textContent : '';
          const priceMatch = text.match(/\$[\d,]+\.?\d*/);

          if (img && priceMatch) {
            items.push({
              name: link.title || img.alt || 'Product',
              image: img.src,
              price: priceMatch[0],
              url: link.href
            });
          }
        });
      } else {
        cells.forEach(cell => {
          const link = cell.querySelector('a');
          const img = cell.querySelector('img');
          const text = cell.textContent || '';
          const priceMatch = text.match(/\$[\d,]+\.?\d*/);

          if (link && img && priceMatch) {
            items.push({
              name: link.title || img.alt || 'Product',
              image: img.src,
              price: priceMatch[0],
              url: link.href
            });
          }
        });
      }

      return items;
    });

    console.log(`\nFound ${products.length} products`);
    if (products.length > 0) {
      console.log('\nFirst 3 products:');
      products.slice(0, 3).forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} - ${p.price}`);
      });
    } else {
      console.log('No products found - site structure may have changed');

      // Debug: Get page structure info
      const info = await page.evaluate(() => {
        return {
          title: document.title,
          hasImages: document.querySelectorAll('img').length,
          hasLinks: document.querySelectorAll('a').length,
          hasPrices: document.body.textContent.includes('$'),
          bodyLength: document.body.innerHTML.length
        };
      });
      console.log('\nPage info:', info);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testScraper();