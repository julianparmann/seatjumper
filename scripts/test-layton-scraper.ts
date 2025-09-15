import { chromium } from 'playwright';

async function testLaytonPage(url: string) {
  const browser = await chromium.launch({
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    console.log(`\n=== Testing Layton page: ${url} ===\n`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Get page title
    const title = await page.title();
    console.log(`Page title: ${title}\n`);

    // Check for various dropdown selectors
    console.log('Checking for dropdowns...');
    const selectors = [
      'select',
      '[data-product-select]',
      '.single-option-selector',
      '.product-form__input select',
      'select[name="id"]',
      'select.product-single__variants',
      '#product-select',
      '.product-options select',
      '.variant-selector',
      '[data-variant-select]'
    ];

    for (const selector of selectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`✓ Found ${elements.length} element(s) with selector: ${selector}`);

        // Try to get options
        try {
          const options = await page.$$eval(`${selector} option`, opts =>
            opts.map(opt => ({
              text: opt.textContent?.trim() || '',
              value: opt.getAttribute('value') || '',
              disabled: opt.disabled
            }))
          );

          if (options.length > 0) {
            console.log(`  Found ${options.length} options:`);
            options.slice(0, 5).forEach(opt => {
              console.log(`    - "${opt.text}" (value: ${opt.value}, disabled: ${opt.disabled})`);
            });
            if (options.length > 5) {
              console.log(`    ... and ${options.length - 5} more`);
            }
          }
        } catch (e) {
          console.log(`  Could not get options for ${selector}`);
        }
      }
    }

    // Check for radio buttons
    console.log('\nChecking for radio buttons...');
    const radioSelectors = [
      'input[type="radio"]',
      '.variant-input input[type="radio"]',
      '.product-form__input input[type="radio"]',
      'input[type="radio"][name="id"]'
    ];

    for (const selector of radioSelectors) {
      const radios = await page.$$(selector);
      if (radios.length > 0) {
        console.log(`✓ Found ${radios.length} radio button(s) with selector: ${selector}`);
      }
    }

    // Check for custom dropdowns (divs that act like dropdowns)
    console.log('\nChecking for custom dropdowns...');
    const customSelectors = [
      '.variant-picker',
      '.variant-buttons',
      '[data-option-selector]',
      '.product-form__item',
      '.variant-wrapper',
      '.product-option'
    ];

    for (const selector of customSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`✓ Found ${elements.length} element(s) with selector: ${selector}`);
      }
    }

    // Try to extract product data from scripts
    console.log('\nChecking for product data in scripts...');
    const productData = await page.evaluate(() => {
      // Check window object
      const windowData: any = {};
      if ((window as any).product) windowData.product = (window as any).product;
      if ((window as any).ShopifyAnalytics?.meta?.product) windowData.meta = (window as any).ShopifyAnalytics.meta.product;
      if ((window as any).theme?.product) windowData.theme = (window as any).theme.product;

      // Check for product JSON in script tags
      const scripts = document.querySelectorAll('script[type="application/json"]');
      const jsonData: any[] = [];

      scripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent || '{}');
          if (data.product || data.variants) {
            jsonData.push(data);
          }
        } catch (e) {}
      });

      // Check for variants in regular script tags
      const variantScripts = document.querySelectorAll('script:not([type]), script[type="text/javascript"]');
      let variantData = null;

      variantScripts.forEach(script => {
        const content = script.textContent || '';
        if (content.includes('variants') && content.includes('price')) {
          const match = content.match(/variants["\s]*:["\s]*(\[[^\]]+\])/);
          if (match) {
            try {
              variantData = JSON.parse(match[1]);
            } catch (e) {}
          }
        }
      });

      return { windowData, jsonData, variantData };
    });

    if (Object.keys(productData.windowData).length > 0) {
      console.log('✓ Found product data in window object');
      console.log(JSON.stringify(productData.windowData, null, 2).substring(0, 500) + '...');
    }

    if (productData.jsonData.length > 0) {
      console.log(`✓ Found ${productData.jsonData.length} JSON script(s) with product data`);
    }

    if (productData.variantData) {
      console.log('✓ Found variant data in script tags');
      console.log(JSON.stringify(productData.variantData, null, 2).substring(0, 500) + '...');
    }

    // Take a screenshot for manual inspection
    await page.screenshot({ path: 'layton-debug.png', fullPage: false });
    console.log('\n📸 Screenshot saved as layton-debug.png');

    // Wait for user to inspect
    console.log('\n⏸️  Browser will stay open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

// Get URL from command line or use a default
const url = process.argv[2] || 'https://laytonsportscards.com/collections/live-breaks';

if (!url.startsWith('http')) {
  console.error('Please provide a valid URL');
  process.exit(1);
}

testLaytonPage(url).then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});