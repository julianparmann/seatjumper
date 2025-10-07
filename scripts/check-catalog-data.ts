/**
 * Check what Catalog API returns for CSV events
 */

import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const getEnvVar = (key: string): string => {
  const match = envContent.match(new RegExp(`^${key}=["']?(.+?)["']?$`, 'm'));
  return match ? match[1] : '';
};

const TOKEN = getEnvVar('MERCURY_ACCESS_TOKEN');
const CATALOG_CONFIG_ID = getEnvVar('MERCURY_CATALOG_CONFIG_ID');

const SANDBOX_BASE = 'https://sandbox.tn-apis.com';

// Event names from CSV
const CSV_EVENTS = [
  "Cirque du Soleil",
  "Moulin Rouge",
  "Norfolk Admirals",
  "Boston Bruins",
  "New Jersey Devils",
  "Washington Capitals"
];

async function searchCatalog(query: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Searching for: "${query}"`);
  console.log(`${'='.repeat(80)}`);

  const url = `${SANDBOX_BASE}/catalog/v2/events/search?q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'X-Listing-Context': `website-config-id=${CATALOG_CONFIG_ID}`,
      },
    });

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      console.log(`Found ${data.results.length} events`);
      console.log('\nFirst result structure:');
      console.log(JSON.stringify(data.results[0], null, 2));
    } else {
      console.log('No results found');
    }

    return data.results || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

async function main() {
  console.log('🔍 Checking Catalog API for CSV Events\n');

  // Search for each CSV event
  for (const eventName of CSV_EVENTS.slice(0, 2)) {
    await searchCatalog(eventName);
  }

  // Also check general search
  console.log('\n\n' + '='.repeat(80));
  console.log('General search (empty query)');
  console.log('='.repeat(80));

  const generalResults = await searchCatalog('');

  console.log(`\n\nTotal events found: ${generalResults.length}`);
  if (generalResults.length > 0) {
    console.log('\nSample event fields:');
    const sample = generalResults[0];
    console.log('Available fields:', Object.keys(sample));
  }
}

main().catch(console.error);
