/**
 * Test specific Ticket Group IDs from CSV
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

console.log('🎫 Testing Ticket Group IDs from CSV\n');
console.log('='.repeat(80));

const SANDBOX_BASE = 'https://sandbox.tn-apis.com';

// TG IDs from the CSV file
const TICKET_GROUP_IDS = [
  4166984, // Cirque du Soleil
  2729515, // Moulin Rouge (48 tickets @ $432)
  4337425, // Moulin Rouge (24 tickets @ $234)
  4358982, // Norfolk Admirals (10 tickets)
  4283379, // Boston Bruins (100 tickets)
  4344586, // Boston Bruins (25 tickets @ $1000)
];

async function testTicketGroupById(tgId: number) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing TG ID: ${tgId}`);
  console.log(`${'='.repeat(80)}`);

  const url = `${SANDBOX_BASE}/mercury/v5/ticketgroups?exchangeTicketGroupId=${tgId}`;

  console.log(`URL: ${url}`);
  console.log(`Headers: broker-id=${BROKER_ID}`);

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'X-Identity-Context': `broker-id=${BROKER_ID}`,
      },
    });

    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }

    console.log(`Status: ${response.status}`);
    console.log(`Body:`, JSON.stringify(body, null, 2));

    return { tgId, status: response.status, body };
  } catch (error) {
    console.error(`Error:`, error);
    return { tgId, error };
  }
}

async function main() {
  const results = [];

  for (const tgId of TICKET_GROUP_IDS) {
    const result = await testTicketGroupById(tgId);
    results.push(result);
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  const found = results.filter(r => r.body?.ticketGroups?.length > 0);
  const notFound = results.filter(r => r.body?.ticketGroups?.length === 0);
  const errors = results.filter(r => r.error || (r.status && r.status >= 400));

  console.log(`\n✓ Found: ${found.length}/${TICKET_GROUP_IDS.length}`);
  console.log(`✗ Not Found: ${notFound.length}/${TICKET_GROUP_IDS.length}`);
  console.log(`⚠ Errors: ${errors.length}/${TICKET_GROUP_IDS.length}`);

  if (found.length > 0) {
    console.log('\n✓ SUCCESS: Found ticket groups!');
    console.log('TG IDs with data:', found.map(r => r.tgId).join(', '));
  } else {
    console.log('\n✗ DIAGNOSIS: None of the CSV ticket groups are accessible');
    console.log('   This means:');
    console.log('   1. These TG IDs are not owned by broker 13870');
    console.log('   2. OR the sandbox data has not been provisioned');
    console.log('   3. OR these TG IDs exist in production but not sandbox');
  }
}

main().catch(console.error);
