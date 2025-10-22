#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// OAuth Client Credentials from .env
const CONSUMER_KEY = '2BI2EFcl2UyPJjEwmA_HRrZ2PgIa';
const CONSUMER_SECRET = 'I_mhfXd6irijN7_fftZXEIa8PSEa';

// Create base64 encoded credentials as per API docs
const base64Credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

function generateToken() {
  return new Promise((resolve, reject) => {
    const postData = 'grant_type=client_credentials&scope=default';

    const options = {
      hostname: 'key-manager.tn-apis.com',
      port: 443,
      path: '/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${base64Credentials}`,
        'Content-Length': postData.length
      }
    };

    console.log('Generating new OAuth token...');
    console.log('URL:', `https://${options.hostname}${options.path}`);
    console.log('Consumer Key:', CONSUMER_KEY);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Status:', res.statusCode);

        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log('✅ SUCCESS! Token generated');
            console.log('Token expires in:', json.expires_in, 'seconds');
            console.log('Token preview:', json.access_token.substring(0, 50) + '...');

            // Save token to file
            fs.writeFileSync('/tmp/mercury_oauth_token.txt', json.access_token);
            console.log('Token saved to /tmp/mercury_oauth_token.txt');

            resolve(json.access_token);
          } catch (e) {
            console.error('Failed to parse response:', e);
            console.log('Response:', data);
            reject(e);
          }
        } else {
          console.log('❌ Failed to generate token');
          console.log('Response:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test the generated token
function testToken(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'sandbox.tn-apis.com',
      port: 443,
      path: '/mercury/v5/ticketgroups?eventId=5202661', // Cirque du Soleil from CSV
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Identity-Context': 'broker-id=13870',
        'Accept': 'application/json'
      }
    };

    console.log('\nTesting token with event 5202661 (Cirque du Soleil)...');
    console.log('URL:', `https://${options.hostname}${options.path}`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Status:', res.statusCode);

        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log('✅ Token works! Found', json.ticketGroups?.length || 0, 'ticket groups');
            if (json.ticketGroups?.length > 0) {
              console.log('\nFirst ticket group:');
              const tg = json.ticketGroups[0];
              console.log('  Section:', tg.section);
              console.log('  Row:', tg.row);
              console.log('  Quantity:', tg.quantity);
              console.log('  Retail Price:', tg.retailPrice?.value);
            }
          } catch (e) {
            console.log('Response:', data.substring(0, 200));
          }
        } else {
          console.log('❌ Token test failed');
          console.log('Response:', data.substring(0, 500));
        }
        resolve({ status: res.statusCode });
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
  console.log('========================================');
  console.log('OAuth 2.0 Token Generation');
  console.log('========================================');

  try {
    const token = await generateToken();
    await testToken(token);

    console.log('\n========================================');
    console.log('Next Steps:');
    console.log('1. Update .env with new token');
    console.log('2. Test with other event IDs from CSV');
    console.log('========================================');
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

main();