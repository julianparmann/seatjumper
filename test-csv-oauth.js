#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Read OAuth token from file
const OAUTH_TOKEN = fs.readFileSync('/tmp/mercury_oauth_token.txt', 'utf8').trim();
const BROKER_ID = '13870';

// Test event IDs from the CSV file
const TEST_EVENTS = [
  { id: '5202661', name: 'Cirque du Soleil' },
  { id: '4494581', name: 'Moulin Rouge Virtual' },
  { id: '5204950', name: 'Norfolk Admirals' },
  { id: '5204545', name: 'Boston Bruins' },
  { id: '5205614', name: 'New Jersey Devils' },
  { id: '5204413', name: 'Washington Capitals' },
  { id: '5206689', name: 'Dallas Mavericks' },
  { id: '5206446', name: 'Phoenix Suns' },
  { id: '5206504', name: 'LA Clippers' }
];

function testEvent(eventId, eventName) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'sandbox.tn-apis.com',
      port: 443,
      path: `/mercury/v5/ticketgroups?eventId=${eventId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OAUTH_TOKEN}`,
        'X-Identity-Context': `broker-id=${BROKER_ID}`,
        'Accept': 'application/json'
      }
    };

    console.log(`\n==================================================`);
    console.log(`Testing: ${eventName} (ID: ${eventId})`);
    console.log(`URL: https://${options.hostname}${options.path}`);
    console.log(`--------------------------------------------------`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Status:', res.statusCode);

        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            const ticketCount = json.ticketGroups?.length || 0;

            if (ticketCount > 0) {
              console.log(`✅ SUCCESS! Found ${ticketCount} ticket groups`);

              // Show first 3 ticket groups as samples
              const samples = json.ticketGroups.slice(0, 3);
              console.log('\n📦 Sample Ticket Groups:');
              samples.forEach((tg, i) => {
                console.log(`  ${i+1}. Section: ${tg.section}, Row: ${tg.row}`);
                console.log(`     Quantity: ${tg.quantity}, Retail: $${tg.retailPrice?.value || 'N/A'}`);
              });
            } else {
              console.log('⚠️  SUCCESS (but no inventory) - Empty ticketGroups array');
            }

            resolve({
              eventId,
              eventName,
              status: res.statusCode,
              hasData: ticketCount > 0,
              ticketCount
            });
          } catch (e) {
            console.log('Failed to parse response:', e.message);
            console.log('Response:', data.substring(0, 200));
            resolve({ eventId, eventName, status: res.statusCode, error: 'Parse error' });
          }
        } else {
          console.log('❌ Failed');
          console.log('Response:', data.substring(0, 500));
          resolve({ eventId, eventName, status: res.statusCode, hasData: false });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      resolve({ eventId, eventName, status: 0, error: error.message });
    });

    req.end();
  });
}

async function main() {
  console.log('========================================');
  console.log('Testing CSV Events with OAuth Token');
  console.log('========================================');
  console.log('OAuth Token:', OAUTH_TOKEN.substring(0, 50) + '...');
  console.log('Broker ID:', BROKER_ID);

  const results = [];

  // Test each event
  for (const event of TEST_EVENTS) {
    const result = await testEvent(event.id, event.name);
    results.push(result);

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n========================================');
  console.log('FINAL SUMMARY');
  console.log('========================================');

  const withData = results.filter(r => r.hasData);
  const successful = results.filter(r => r.status === 200);
  const failed = results.filter(r => r.status !== 200);

  console.log(`Total Events Tested: ${results.length}`);
  console.log(`Successful Requests: ${successful.length}`);
  console.log(`Failed Requests: ${failed.length}`);
  console.log(`Events with Inventory: ${withData.length}`);

  if (withData.length > 0) {
    console.log('\n🎉 Events with actual inventory:');
    withData.forEach(r => {
      console.log(`  ✅ ${r.eventName} (${r.eventId}): ${r.ticketCount} tickets`);
    });
  } else {
    console.log('\n⚠️  No events have inventory data in sandbox');
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed requests:');
    failed.forEach(r => {
      console.log(`  - ${r.eventName} (${r.eventId}): Status ${r.status}`);
    });
  }
}

main().catch(console.error);