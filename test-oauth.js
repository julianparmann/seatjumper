#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Load OAuth token from file
const TOKEN = fs.readFileSync('/tmp/mercury_latest_token.txt', 'utf8').trim();
const BROKER_ID = '13870';

function testOAuth(eventId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'sandbox.tn-apis.com',
      port: 443,
      path: `/mercury/v5/ticketgroups?eventId=${eventId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'X-Identity-Context': `broker-id=${BROKER_ID}`,
        'Accept': 'application/json'
      }
    };

    console.log('\nTesting event:', eventId);
    console.log('URL:', `https://${options.hostname}${options.path}`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Status:', res.statusCode);

        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log('✅ SUCCESS! Got response with', json.ticketGroups?.length || 0, 'ticket groups');
            if (json.ticketGroups?.length > 0) {
              console.log('Sample ticket:', JSON.stringify(json.ticketGroups[0], null, 2));
            }
          } catch (e) {
            console.log('Response:', data);
          }
        } else {
          console.log('Response:', data);
        }
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      reject(error);
    });

    req.end();
  });
}

async function main() {
  console.log('Testing Mercury API with OAuth Bearer token...');
  console.log('Token preview:', TOKEN.substring(0, 50) + '...');

  // Test multiple event IDs
  const eventIds = ['5206689', '5202661', '4494581', '5204950'];

  for (const eventId of eventIds) {
    await testOAuth(eventId);
  }
}

main().catch(console.error);