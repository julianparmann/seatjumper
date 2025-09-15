const { chromium } = require('playwright');

async function testScraper() {
  const browser = await chromium.launch({ headless: false }); // Run with UI to see what's happening
  const page = await browser.newPage();

  try {
    console.log('Navigating to page...');
    await page.goto('https://www.sportscollectibles.com/autographed_trading_cards_c9931.htm', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Page loaded, waiting a bit for dynamic content...');
    await page.waitForTimeout(3000);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'sc-debug.png' });
    console.log('Screenshot saved as sc-debug.png');

    // Check if page requires any interaction
    const hasProducts = await page.$$eval('.v65-productDisplay-row', rows => rows.length);
    console.log(`Found ${hasProducts} product rows with .v65-productDisplay-row`);

    // Try alternate selectors
    const selectors = [
      '.v65-productDisplay',
      '.v65-productDisplay-row',
      '.v65-productDisplay-cell',
      'div[id*="product"]',
      'table[class*="product"]',
      '.product-grid-cell',
      '[data-product]'
    ];

    for (const selector of selectors) {
      const count = await page.$$(selector);
      if (count.length > 0) {
        console.log(`Found ${count.length} elements with selector: ${selector}`);
      }
    }

    // Check the actual page structure
    const pageStructure = await page.evaluate(() => {
      // Find all divs that contain both an image and a price
      const potentialProducts = [];
      const allDivs = document.querySelectorAll('div');

      allDivs.forEach(div => {
        const hasImage = div.querySelector('img[src*="product"], img[src*="item"], img[alt]');
        const hasPrice = div.textContent?.includes('$') && div.textContent.match(/\$\d+/);
        const hasLink = div.querySelector('a[href*=".htm"]');

        if (hasImage && hasPrice && hasLink) {
          potentialProducts.push({
            className: div.className,
            id: div.id,
            html: div.outerHTML.substring(0, 500)
          });
        }
      });

      return potentialProducts.slice(0, 3);
    });

    console.log('\nPotential product containers found:');
    console.log(JSON.stringify(pageStructure, null, 2));

    // Try to extract products with a more flexible approach
    const products = await page.evaluate(() => {
      const items = [];

      // Method 1: Find all product cells
      const cells = document.querySelectorAll('.v65-productDisplay-cell');
      if (cells.length > 0) {
        cells.forEach(cell => {
          const link = cell.querySelector('a');
          const img = cell.querySelector('img');
          const text = cell.textContent || '';
          const priceMatch = text.match(/\$[\d,]+\.?\d*/);

          if (link && img && priceMatch) {
            items.push({
              name: link.title || img.alt || 'Unknown',
              url: link.href,
              image: img.src,
              price: priceMatch[0]
            });
          }
        });
      }

      // Method 2: Find by structure pattern
      if (items.length === 0) {
        const links = document.querySelectorAll('a[href*="_p"][href*=".htm"]');
        links.forEach(link => {
          const img = link.querySelector('img');
          if (img) {
            // Look for price near the link
            let priceElement = link.parentElement;
            let attempts = 0;
            let priceText = '';

            while (priceElement && attempts < 5) {
              const text = priceElement.textContent || '';
              const priceMatch = text.match(/\$[\d,]+\.?\d*/);
              if (priceMatch) {
                priceText = priceMatch[0];
                break;
              }
              priceElement = priceElement.parentElement;
              attempts++;
            }

            if (priceText) {
              items.push({
                name: link.title || img.alt || link.href.split('/').pop(),
                url: link.href,
                image: img.src,
                price: priceText
              });
            }
          }
        });
      }

      return items.slice(0, 10);
    });

    console.log('\nProducts extracted:');
    products.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}`);
      console.log(`   Price: ${p.price}`);
      console.log(`   URL: ${p.url}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('\nPress Ctrl+C to close the browser...');
    // Keep browser open for inspection
    await page.waitForTimeout(60000);
    await browser.close();
  }
}

testScraper();