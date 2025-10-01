import { chromium } from 'playwright';

async function debugScraper() {
  const url = 'https://laytonsportscards.com/collections/live-breaks/products/2025-panini-donruss-football-hobby-box-6-box-break-2-pick-your-team';

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Loading page...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);

    // Get all select elements and their options
    const selectData = await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      const results: any[] = [];

      selects.forEach((select, index) => {
        const options = Array.from(select.options);
        const selectInfo = {
          index,
          id: select.id,
          name: select.name,
          className: select.className,
          optionCount: options.length,
          options: options.map(opt => ({
            text: opt.textContent?.trim(),
            value: opt.value,
            disabled: opt.disabled,
            selected: opt.selected,
            index: opt.index,
            style: opt.getAttribute('style'),
            className: opt.className,
            parentTag: opt.parentElement?.tagName,
            inOptgroup: opt.parentElement?.tagName === 'OPTGROUP'
          }))
        };
        results.push(selectInfo);
      });

      return results;
    });

    console.log('\n=== SELECT ELEMENTS DEBUG ===\n');
    selectData.forEach((select: any) => {
      console.log(`Select #${select.index}:`);
      console.log(`  ID: ${select.id || 'none'}`);
      console.log(`  Name: ${select.name || 'none'}`);
      console.log(`  Class: ${select.className || 'none'}`);
      console.log(`  Options: ${select.optionCount}`);

      // Show all options to debug
      console.log('\n  All options:');
      select.options.slice(0, 10).forEach((opt: any) => {
        console.log(`    [${opt.index}] ${opt.text}`);
        console.log(`      Value: "${opt.value}"`);
        console.log(`      Disabled: ${opt.disabled}`);
        if (opt.text && opt.text.includes('$')) {
          console.log(`      >>> HAS PRICE <<<`);
        }
      });

      if (select.options.length > 10) {
        console.log(`    ... and ${select.options.length - 10} more options`);

        // Also show any that have prices
        const priceOptions = select.options.filter((o: any) => o.text && o.text.includes('$'));
        if (priceOptions.length > 0) {
          console.log(`\n  Total options with prices: ${priceOptions.length}`);
        }
      }
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugScraper();