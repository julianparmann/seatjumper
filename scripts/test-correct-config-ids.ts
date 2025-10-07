/**
 * Test with CORRECT config IDs from the email
 * Catalog API: website-config-id=23884
 * Mercury API: website-config-id=27735 OR broker-id=13870
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
const BROKER_ID = getEnvVar('MERCURY_BROKER_ID');
const CATALOG_CONFIG_ID = getEnvVar('MERCURY_CATALOG_CONFIG_ID');
const WEBSITE_CONFIG_ID = getEnvVar('MERCURY_WEBSITE_CONFIG_ID');

console.log('🔍 Testing with CORRECT Config IDs\n');
console.log('='.repeat(80));
console.log(`Catalog Config ID: ${CATALOG_CONFIG_ID} (for Catalog API)`);
console.log(`Website Config ID: ${WEBSITE_CONFIG_ID} (for Mercury API)`);
console.log(`Broker ID: ${BROKER_ID} (alternative for Mercury API)`);
console.log('='.repeat(80));

const SANDBOX_BASE = 'https://sandbox.tn-apis.com';
const TEST_EVENT_IDS_FROM_CSV = [5202661, 4494581, 5204950, 5204545];

async function test(name: string, url: string, headers: Record<string, string>) {
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`TEST: ${name}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`URL: ${url}`);
  console.log(`Headers:`);
  Object.entries(headers).forEach(([key, value]) => {
    if (key === 'Authorization') {
      console.log(`  ${key}: Bearer ${value.replace('Bearer ', '').substring(0, 30)}...`);
    } else {
      console.log(`  ${key}: ${value}`);
    }
  });

  try {
    const response = await fetch(url, { headers });
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }

    console.log(`\nStatus: ${response.status} ${response.statusText}`);

    if (response.ok) {
      if (body.results) {
        console.log(`✓ Found ${body.results.length} events`);
        console.log(`First few events:`, body.results.slice(0, 3).map((e: any) => ({
          id: e.id,
          name: e.name,
          date: e.date,
        })));
      } else if (body.ticketGroups) {
        console.log(`✓ Found ${body.ticketGroups.length} ticket groups`);
        if (body.ticketGroups.length > 0) {
          console.log(`First ticket group:`, {
            exchangeTicketGroupId: body.ticketGroups[0].exchangeTicketGroupId,
            eventId: body.ticketGroups[0].eventId,
            availableQuantity: body.ticketGroups[0].availableQuantity,
            section: body.ticketGroups[0].section,
          });
        }
      } else {
        console.log(`Body:`, JSON.stringify(body, null, 2).substring(0, 500));
      }
    } else {
      console.log(`✗ Error:`, body);
    }

    return { success: response.ok, status: response.status, body };
  } catch (error) {
    console.log(`\n❌ ERROR:`, error);
    return { success: false, error };
  }
}

async function main() {
  const baseHeaders = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };

  // Test 1: Catalog API with CORRECT config ID (23884)
  const catalogResult = await test(
    '1. Catalog API with website-config-id=23884 (CORRECT)',
    `${SANDBOX_BASE}/catalog/v2/events/search?q=NHL`,
    {
      ...baseHeaders,
      'X-Listing-Context': `website-config-id=${CATALOG_CONFIG_ID}`,
    }
  );

  // Test 2: If catalog works, try to get ticketgroups for first event
  if (catalogResult.body?.results?.[0]) {
    const firstEventId = catalogResult.body.results[0].id;
    await test(
      `2. Mercury ticketgroups for Catalog event ${firstEventId}`,
      `${SANDBOX_BASE}/mercury/v5/ticketgroups?eventId=${firstEventId}`,
      {
        ...baseHeaders,
        'X-Identity-Context': `website-config-id=${WEBSITE_CONFIG_ID}`,
      }
    );
  }

  // Test 3: Try CSV event IDs with correct config
  console.log('\n\n' + '='.repeat(80));
  console.log('Testing CSV Event IDs with correct Mercury config');
  console.log('='.repeat(80));

  for (const eventId of TEST_EVENT_IDS_FROM_CSV.slice(0, 2)) {
    await test(
      `Mercury ticketgroups for CSV event ${eventId}`,
      `${SANDBOX_BASE}/mercury/v5/ticketgroups?eventId=${eventId}`,
      {
        ...baseHeaders,
        'X-Identity-Context': `website-config-id=${WEBSITE_CONFIG_ID}`,
      }
    );
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('✅ TEST COMPLETE');
  console.log('='.repeat(80));
  console.log('\nIf Catalog API worked, we can now discover events.');
  console.log('If Mercury API shows ticketgroups, we can access inventory.');
}

main().catch(console.error);
