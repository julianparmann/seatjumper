#!/usr/bin/env node

// Test Mercury API with apikey header format as suggested by error message
const https = require('https');

// Configuration from .env
const API_KEY = 'eyJ4NXQiOiJaVGxpWkRreU1HTTJZekE0TldJNU5tTXpNakJsTlRFeU5UTm1ObVUxTnpneE5UTTFORGN4WkE9PSIsImtpZCI6ImdhdGV3YXlfY2VydGlmaWNhdGVfYWxpYXMiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJTZWF0SnVtcGVyLXN0b3JlQGNhcmJvbi5zdXBlciIsImFwcGxpY2F0aW9uIjp7Im93bmVyIjoiU2VhdEp1bXBlci1zdG9yZSIsInRpZXJRdW90YVR5cGUiOm51bGwsInRpZXIiOiI1MFBlck1pbiIsIm5hbWUiOiJUZXN0QXBwbGljYXRpb24iLCJpZCI6MzA0MiwidXVpZCI6ImYxNzFiMWJlLWFkNDAtNGMzYy1iYTViLTlmN2Q2ZDllYjZhZCJ9LCJpc3MiOiJodHRwczpcL1wvY29uc29sZS50bi1hcGlzLmNvbTo0NDNcL29hdXRoMlwvdG9rZW4iLCJ0aWVySW5mbyI6eyJUcmlhbCI6eyJ0aWVyUXVvdGFUeXBlIjoicmVxdWVzdENvdW50IiwiZ3JhcGhRTE1heENvbXBsZXhpdHkiOjAsImdyYXBoUUxNYXhEZXB0aCI6MCwic3RvcE9uUXVvdGFSZWFjaCI6dHJ1ZSwic3Bpa2VBcnJlc3RMaW1pdCI6LTEsInNwaWtlQXJyZXN0VW5pdCI6Ik5BIn19LCJrZXl0eXBlIjoiU0FOREJPWCIsInBlcm1pdHRlZFJlZmVyZXIiOiIiLCJzdWJzY3JpYmVkQVBJcyI6W3sic3Vic2NyaWJlclRlbmFudERvbWFpbiI6ImNhcmJvbi5zdXBlciIsIm5hbWUiOiJDYXRhbG9nQVBJIiwiY29udGV4dCI6IlwvY2F0YWxvZ1wvdjIiLCJwdWJsaXNoZXIiOiJUaWNrZXROZXR3b3JrIiwidmVyc2lvbiI6InYyIiwic3Vic2NyaXB0aW9uVGllciI6IlRyaWFsIn0seyJzdWJzY3JpYmVyVGVuYW50RG9tYWluIjoiY2FyYm9uLnN1cGVyIiwibmFtZSI6Ik1lcmN1cnlBUEkiLCJjb250ZXh0IjoiXC9tZXJjdXJ5XC92NSIsInB1Ymxpc2hlciI6IlRpY2tldE5ldHdvcmsiLCJ2ZXJzaW9uIjoidjUiLCJzdWJzY3JpcHRpb25UaWVyIjoiVHJpYWwifSx7InN1YnNjcmliZXJUZW5hbnREb21haW4iOiJjYXJib24uc3VwZXIiLCJuYW1lIjoiVGlja2V0VmF1bHRBUEkiLCJjb250ZXh0IjoiXC90aWNrZXR2YXVsdFwvdjIiLCJwdWJsaXNoZXIiOiJUaWNrZXROZXR3b3JrIiwidmVyc2lvbiI6InYyIiwic3Vic2NyaXB0aW9uVGllciI6IlRyaWFsIn0seyJzdWJzY3JpYmVyVGVuYW50RG9tYWluIjoiY2FyYm9uLnN1cGVyIiwibmFtZSI6IldlYkhvb2tBUEkiLCJjb250ZXh0IjoiXC93ZWJob29rXC92MSIsInB1Ymxpc2hlciI6IlRpY2tldE5ldHdvcmsiLCJ2ZXJzaW9uIjoidjEiLCJzdWJzY3JpcHRpb25UaWVyIjoiVHJpYWwifV0sInRva2VuX3R5cGUiOiJhcGlLZXkiLCJwZXJtaXR0ZWRJUCI6IiIsImlhdCI6MTc1OTk0MzQ3MSwianRpIjoiYmYwMDhjNGQtOGY0My00NDYxLWFlMWUtOGVlYjFjMjAzOTc4In0=.JBy_I_U_uQmoj364hbc8nms4bc4pX-aC0E9n9BBMnLa9jIwTgCdM-xpaBU8AVCMWUNZOupFJnRHg19qkWTqSgn--AgeAzhjNT8T-KpaXYBIap3LF-iMH9Bj4vy3093cG0_XaUQdDtIi8tH8pRfNKErBZeFzbGc7XTEW8uoieeHWLLP_qAZVudH_xvFH7WWGbu4FFNHfbTywZx1e3fPEdfYLaeXvGsBwe2fO0b3V66CLUeekBaC2eg8jq8nQnzBcoT2gsbdLzzhlnqrL7NHddbsXW0HU7ImsZ_C662FLRJ8vsPDjPpgqNjv1zh64ozHtbMCnQ5Ceq3y7xo-stk2TIiw==';

const BROKER_ID = '13870';
const WEBSITE_CONFIG_ID = '27735';

// Test event IDs
const TEST_EVENT_IDS = [
  '5206689',
  '5202661',
  '4494581',
  '5204950'
];

function makeRequest(path, headers) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'sandbox.tn-apis.com',
      port: 443,
      path: path,
      method: 'GET',
      headers: headers
    };

    console.log('\n=== Testing Request ===');
    console.log('URL:', `https://${options.hostname}${options.path}`);
    console.log('Headers:', JSON.stringify(headers, null, 2));

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);

        // Parse and pretty print if JSON
        try {
          const json = JSON.parse(data);
          console.log('Parsed Response:', JSON.stringify(json, null, 2));
        } catch (e) {
          // Not JSON, already printed raw
        }

        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });

    req.on('error', (error) => {
      console.error('Request Error:', error);
      reject(error);
    });

    req.end();
  });
}

async function testApiKeyHeader() {
  console.log('Testing Mercury API with apikey header format...\n');
  console.log('Note: Error message suggested: "apikey: API_KEY" format\n');

  // Test 1: Using lowercase 'apikey' as a separate header (as suggested by error)
  console.log('\n### Test 1: apikey header (lowercase) with broker-id ###');
  const result1 = await makeRequest('/mercury/v5/ticketgroups?eventId=5206689', {
    'apikey': API_KEY,
    'X-Identity-Context': `broker-id=${BROKER_ID}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  });

  if (result1.status === 200) {
    console.log('\n✅ SUCCESS! Authentication worked with apikey header');
    return;
  }

  // Test 2: Try with website-config-id instead
  console.log('\n### Test 2: apikey header with website-config-id ###');
  const result2 = await makeRequest('/mercury/v5/ticketgroups?eventId=5206689', {
    'apikey': API_KEY,
    'X-Identity-Context': `website-config-id=${WEBSITE_CONFIG_ID}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  });

  if (result2.status === 200) {
    console.log('\n✅ SUCCESS! Authentication worked with apikey header and website-config-id');
    return;
  }

  // Test 3: Try without X-Identity-Context
  console.log('\n### Test 3: apikey header without X-Identity-Context ###');
  const result3 = await makeRequest('/mercury/v5/ticketgroups?eventId=5206689', {
    'apikey': API_KEY,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  });

  if (result3.status === 200) {
    console.log('\n✅ SUCCESS! Authentication worked with just apikey header');
    return;
  }

  // Test 4: Try different event IDs in case 5206689 doesn't exist
  console.log('\n### Test 4: Testing different event IDs ###');
  for (const eventId of TEST_EVENT_IDS) {
    console.log(`\nTrying event ID: ${eventId}`);
    const result = await makeRequest(`/mercury/v5/ticketgroups?eventId=${eventId}`, {
      'apikey': API_KEY,
      'X-Identity-Context': `broker-id=${BROKER_ID}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    if (result.status === 200) {
      console.log(`\n✅ SUCCESS! Event ID ${eventId} returned data`);
      const data = JSON.parse(result.data);
      if (data.ticketGroups && data.ticketGroups.length > 0) {
        console.log(`Found ${data.ticketGroups.length} ticket groups!`);
        console.log('First ticket group:', JSON.stringify(data.ticketGroups[0], null, 2));
        break;
      }
    }
  }

  console.log('\n\n=== Summary ===');
  console.log('Tested apikey header format as suggested by error message');
  console.log('If all tests failed with 401, the issue may be:');
  console.log('1. The API key itself is invalid or expired');
  console.log('2. The sandbox environment requires different credentials');
  console.log('3. There may be IP whitelisting in place');
}

testApiKeyHeader().catch(console.error);