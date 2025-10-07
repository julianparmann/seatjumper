/**
 * Raw Mercury API Test - No dependencies on other services
 */

// Read token from .env manually
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
const WEBSITE_CONFIG_ID = getEnvVar('MERCURY_WEBSITE_CONFIG_ID');

console.log('🔍 Mercury API Raw Diagnostic Test\n');
console.log('='.repeat(80));
console.log(`Token: ${TOKEN.substring(0, 50)}...`);
console.log(`Broker ID: ${BROKER_ID}`);
console.log(`Website Config ID: ${WEBSITE_CONFIG_ID}`);
console.log('='.repeat(80));

const SANDBOX_BASE = 'https://sandbox.tn-apis.com';
const TEST_EVENT_ID = 5202661;

async function test(name: string, url: string, headers: Record<string, string>) {
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`TEST: ${name}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`URL: ${url}`);
  console.log(`Headers:`);
  Object.entries(headers).forEach(([key, value]) => {
    if (key === 'Authorization') {
      console.log(`  ${key}: Bearer ${value.replace('Bearer ', '').substring(0, 50)}...`);
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
    console.log(`Response Headers:`);
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log(`\nBody:`);
    console.log(JSON.stringify(body, null, 2));

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

  // Test 1: Ticketgroups with broker-id
  await test(
    'Ticketgroups for event with broker-id',
    `${SANDBOX_BASE}/mercury/v5/ticketgroups?eventId=${TEST_EVENT_ID}`,
    {
      ...baseHeaders,
      'X-Identity-Context': `broker-id=${BROKER_ID}`,
    }
  );

  // Test 2: Ticketgroups with website-config-id
  await test(
    'Ticketgroups for event with website-config-id',
    `${SANDBOX_BASE}/mercury/v5/ticketgroups?eventId=${TEST_EVENT_ID}`,
    {
      ...baseHeaders,
      'X-Identity-Context': `website-config-id=${WEBSITE_CONFIG_ID}`,
    }
  );

  // Test 3: Ticketgroups without X-Identity-Context
  await test(
    'Ticketgroups WITHOUT X-Identity-Context',
    `${SANDBOX_BASE}/mercury/v5/ticketgroups?eventId=${TEST_EVENT_ID}`,
    baseHeaders
  );

  // Test 4: Catalog API
  await test(
    'Catalog API search',
    `${SANDBOX_BASE}/catalog/v2/events/search?q=NBA`,
    {
      ...baseHeaders,
      'X-Listing-Context': `website-config-id=${WEBSITE_CONFIG_ID}`,
    }
  );

  // Test 5: Alternative broker
  await test(
    'Ticketgroups with alternative broker 9999',
    `${SANDBOX_BASE}/mercury/v5/ticketgroups?eventId=${TEST_EVENT_ID}`,
    {
      ...baseHeaders,
      'X-Identity-Context': `broker-id=9999`,
    }
  );

  // Test 6: Try NHL event from CSV
  await test(
    'Ticketgroups for NHL event 5204950',
    `${SANDBOX_BASE}/mercury/v5/ticketgroups?eventId=5204950`,
    {
      ...baseHeaders,
      'X-Identity-Context': `broker-id=${BROKER_ID}`,
    }
  );

  console.log('\n\n' + '='.repeat(80));
  console.log('TESTS COMPLETE');
  console.log('='.repeat(80));
}

main().catch(console.error);
