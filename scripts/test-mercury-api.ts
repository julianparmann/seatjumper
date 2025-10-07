/**
 * Mercury API Diagnostic Script
 * Tests various API endpoints and configurations to diagnose inventory issues
 */

import { mercuryTokenService } from '../lib/services/mercury-token-service';

const SANDBOX_BASE = 'https://sandbox.tn-apis.com';
const BROKER_ID = '13870';
const TEST_EVENT_IDS = [5202661, 4494581, 5204950, 5204545, 5205614, 5204413];

interface TestResult {
  test: string;
  success: boolean;
  status?: number;
  headers?: Record<string, string>;
  body?: any;
  error?: string;
}

const results: TestResult[] = [];

async function makeRequest(
  url: string,
  headers: Record<string, string>,
  testName: string
): Promise<TestResult> {
  try {
    console.log(`\n=== ${testName} ===`);
    console.log(`URL: ${url}`);
    console.log(`Headers:`, JSON.stringify(headers, null, 2));

    const response = await fetch(url, { headers });

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const bodyText = await response.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = bodyText;
    }

    console.log(`Status: ${response.status}`);
    console.log(`Response Headers:`, JSON.stringify(responseHeaders, null, 2));
    console.log(`Body:`, JSON.stringify(body, null, 2));

    return {
      test: testName,
      success: response.ok,
      status: response.status,
      headers: responseHeaders,
      body,
    };
  } catch (error) {
    console.error(`Error:`, error);
    return {
      test: testName,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runTests() {
  console.log('🔍 Mercury API Diagnostic Test Suite\n');
  console.log('='.repeat(80));

  // Get OAuth token
  const token = await mercuryTokenService.getToken();
  console.log(`\n✓ OAuth Token obtained: ${token.substring(0, 50)}...`);

  const baseHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Test 1: Get ticketgroups WITHOUT any filters (global inventory)
  results.push(await makeRequest(
    `${SANDBOX_BASE}/mercury/v5/ticketgroups`,
    {
      ...baseHeaders,
      'X-Identity-Context': `broker-id=${BROKER_ID}`,
    },
    'Test 1: GET /ticketgroups (no filters, should fail per spec)'
  ));

  // Test 2: Get ticketgroups for first test event with broker 13870
  results.push(await makeRequest(
    `${SANDBOX_BASE}/mercury/v5/ticketgroups?eventId=${TEST_EVENT_IDS[0]}`,
    {
      ...baseHeaders,
      'X-Identity-Context': `broker-id=${BROKER_ID}`,
    },
    `Test 2: GET /ticketgroups for event ${TEST_EVENT_IDS[0]} with broker ${BROKER_ID}`
  ));

  // Test 3: Get ticketgroups with alternative test broker
  results.push(await makeRequest(
    `${SANDBOX_BASE}/mercury/v5/ticketgroups?eventId=${TEST_EVENT_IDS[0]}`,
    {
      ...baseHeaders,
      'X-Identity-Context': `broker-id=9999`,
    },
    `Test 3: GET /ticketgroups for event ${TEST_EVENT_IDS[0]} with broker 9999`
  ));

  // Test 4: Search Catalog API for events
  results.push(await makeRequest(
    `${SANDBOX_BASE}/catalog/v2/events/search?q=NBA`,
    {
      ...baseHeaders,
      'X-Listing-Context': `website-config-id=27735`,
    },
    'Test 4: Catalog API search for NBA events'
  ));

  // Test 5: Get ticketgroups for first Catalog event (if we got any)
  const catalogResult = results[results.length - 1];
  if (catalogResult.body?.results?.[0]?.id) {
    const catalogEventId = catalogResult.body.results[0].id;
    results.push(await makeRequest(
      `${SANDBOX_BASE}/mercury/v5/ticketgroups?eventId=${catalogEventId}`,
      {
        ...baseHeaders,
        'X-Identity-Context': `broker-id=${BROKER_ID}`,
      },
      `Test 5: GET /ticketgroups for Catalog event ${catalogEventId}`
    ));
  }

  // Test 6: Check if we can list events using website-config-id
  results.push(await makeRequest(
    `${SANDBOX_BASE}/mercury/v5/ticketgroups?eventId=${TEST_EVENT_IDS[0]}`,
    {
      ...baseHeaders,
      'X-Identity-Context': `website-config-id=27735`,
    },
    `Test 6: GET /ticketgroups using website-config-id instead of broker-id`
  ));

  // Test 7: Try without X-Identity-Context
  results.push(await makeRequest(
    `${SANDBOX_BASE}/mercury/v5/ticketgroups?eventId=${TEST_EVENT_IDS[0]}`,
    baseHeaders,
    'Test 7: GET /ticketgroups WITHOUT X-Identity-Context header'
  ));

  // Test 8: Check multiple test events
  console.log('\n\n=== Test 8: Checking all CSV test events ===');
  for (const eventId of TEST_EVENT_IDS) {
    results.push(await makeRequest(
      `${SANDBOX_BASE}/mercury/v5/ticketgroups?eventId=${eventId}`,
      {
        ...baseHeaders,
        'X-Identity-Context': `broker-id=${BROKER_ID}`,
      },
      `Test 8.${eventId}: Event ${eventId}`
    ));
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));

  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.test}`);
    console.log(`   Status: ${result.success ? '✓ SUCCESS' : '✗ FAILED'} (${result.status || 'N/A'})`);

    if (result.body) {
      if (result.body.ticketGroups) {
        console.log(`   Inventory: ${result.body.ticketGroups.length} ticketgroups`);
      } else if (result.body.results) {
        console.log(`   Events: ${result.body.results.length} events found`);
      } else if (result.body.message) {
        console.log(`   Message: ${result.body.message}`);
      }
    }

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  // Analysis
  console.log('\n\n' + '='.repeat(80));
  console.log('🔬 ANALYSIS');
  console.log('='.repeat(80));

  const hasInventory = results.some(r => r.body?.ticketGroups?.length > 0);
  const catalogWorking = results.some(r => r.body?.results?.length > 0);
  const authWorking = results.every(r => r.status !== 401);

  console.log(`\n✓ OAuth Authentication: ${authWorking ? 'WORKING' : 'FAILED'}`);
  console.log(`✓ Catalog API: ${catalogWorking ? 'WORKING' : 'FAILED'}`);
  console.log(`${hasInventory ? '✓' : '✗'} Mercury Inventory: ${hasInventory ? 'FOUND' : 'EMPTY'}`);

  if (!hasInventory) {
    console.log('\n⚠️  DIAGNOSIS: No inventory found in any test scenario.');
    console.log('   Possible causes:');
    console.log('   1. Broker 13870 has no test data provisioned in sandbox');
    console.log('   2. Website config 27735 may need to be used instead');
    console.log('   3. Test event IDs may be invalid/expired');
    console.log('   4. API token may not have correct scopes');
    console.log('\n   RECOMMENDATION: Contact Mercury/TicketNetwork support to provision');
    console.log('   test inventory for broker 13870 or provide valid test credentials.');
  } else {
    console.log('\n✓ Inventory found! Check results above to see which configuration works.');
  }

  console.log('\n' + '='.repeat(80));
}

// Run the tests
runTests().catch(console.error);
