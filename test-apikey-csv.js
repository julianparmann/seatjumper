#!/usr/bin/env node

const https = require('https');

// API Configuration
const API_KEY = 'eyJ4NXQiOiJaVGxpWkRreU1HTTJZekE0TldJNU5tTXpNakJsTlRFeU5UTm1ObVUxTnpneE5UTTFORGN4WkE9PSIsImtpZCI6ImdhdGV3YXlfY2VydGlmaWNhdGVfYWxpYXMiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJTZWF0SnVtcGVyLXN0b3JlQGNhcmJvbi5zdXBlciIsImFwcGxpY2F0aW9uIjp7Im93bmVyIjoiU2VhdEp1bXBlci1zdG9yZSIsInRpZXJRdW90YVR5cGUiOm51bGwsInRpZXIiOiI1MFBlck1pbiIsIm5hbWUiOiJUZXN0QXBwbGljYXRpb24iLCJpZCI6MzA0MiwidXVpZCI6ImYxNzFiMWJlLWFkNDAtNGMzYy1iYTViLTlmN2Q2ZDllYjZhZCJ9LCJpc3MiOiJodHRwczpcL1wvY29uc29sZS50bi1hcGlzLmNvbTo0NDNcL29hdXRoMlwvdG9rZW4iLCJ0aWVySW5mbyI6eyJUcmlhbCI6eyJ0aWVyUXVvdGFUeXBlIjoicmVxdWVzdENvdW50IiwiZ3JhcGhRTE1heENvbXBsZXhpdHkiOjAsImdyYXBoUUxNYXhEZXB0aCI6MCwic3RvcE9uUXVvdGFSZWFjaCI6dHJ1ZSwic3Bpa2VBcnJlc3RMaW1pdCI6LTEsInNwaWtlQXJyZXN0VW5pdCI6Ik5BIn19LCJrZXl0eXBlIjoiU0FOREJPWCIsInBlcm1pdHRlZFJlZmVyZXIiOiIiLCJzdWJzY3JpYmVkQVBJcyI6W3sic3Vic2NyaWJlclRlbmFudERvbWFpbiI6ImNhcmJvbi5zdXBlciIsIm5hbWUiOiJDYXRhbG9nQVBJIiwiY29udGV4dCI6IlwvY2F0YWxvZ1wvdjIiLCJwdWJsaXNoZXIiOiJUaWNrZXROZXR3b3JrIiwidmVyc2lvbiI6InYyIiwic3Vic2NyaXB0aW9uVGllciI6IlRyaWFsIn0seyJzdWJzY3JpYmVyVGVuYW50RG9tYWluIjoiY2FyYm9uLnN1cGVyIiwibmFtZSI6Ik1lcmN1cnlBUEkiLCJjb250ZXh0IjoiXC9tZXJjdXJ5XC92NSIsInB1Ymxpc2hlciI6IlRpY2tldE5ldHdvcmsiLCJ2ZXJzaW9uIjoidjUiLCJzdWJzY3JpcHRpb25UaWVyIjoiVHJpYWwifSx7InN1YnNjcmliZXJUZW5hbnREb21haW4iOiJjYXJib24uc3VwZXIiLCJuYW1lIjoiVGlja2V0VmF1bHRBUEkiLCJjb250ZXh0IjoiXC90aWNrZXR2YXVsdFwvdjIiLCJwdWJsaXNoZXIiOiJUaWNrZXROZXR3b3JrIiwidmVyc2lvbiI6InYyIiwic3Vic2NyaXB0aW9uVGllciI6IlRyaWFsIn0seyJzdWJzY3JpYmVyVGVuYW50RG9tYWluIjoiY2FyYm9uLnN1cGVyIiwibmFtZSI6IldlYkhvb2tBUEkiLCJjb250ZXh0IjoiXC93ZWJob29rXC92MSIsInB1Ymxpc2hlciI6IlRpY2tldE5ldHdvcmsiLCJ2ZXJzaW9uIjoidjEiLCJzdWJzY3JpcHRpb25UaWVyIjoiVHJpYWwifV0sInRva2VuX3R5cGUiOiJhcGlLZXkiLCJwZXJtaXR0ZWRJUCI6IiIsImlhdCI6MTc1OTk0MzQ3MSwianRpIjoiYmYwMDhjNGQtOGY0My00NDYxLWFlMWUtOGVlYjFjMjAzOTc4In0=.JBy_I_U_uQmoj364hbc8nms4bc4pX-aC0E9n9BBMnLa9jIwTgCdM-xpaBU8AVCMWUNZOupFJnRHg19qkWTqSgn--AgeAzhjNT8T-KpaXYBIap3LF-iMH9Bj4vy3093cG0_XaUQdDtIi8tH8pRfNKErBZeFzbGc7XTEW8uoieeHWLLP_qAZVudH_xvFH7WWGbu4FFNHfbTywZx1e3fPEdfYLaeXvGsBwe2fO0b3V66CLUeekBaC2eg8jq8nQnzBcoT2gsbdLzzhlnqrL7NHddbsXW0HU7ImsZ_C662FLRJ8vsPDjPpgqNjv1zh64ozHtbMCnQ5Ceq3y7xo-stk2TIiw==';
const BROKER_ID = '13870';

// Test event IDs from the CSV file with actual inventory data
const TEST_EVENTS = [
  { id: '5202661', name: 'Cirque du Soleil' },
  { id: '4494581', name: 'Moulin Rouge Virtual' },
  { id: '5204950', name: 'Norfolk Admirals' },
  { id: '5204545', name: 'Boston Bruins' },
  { id: '5205614', name: 'New Jersey Devils' },
  { id: '5204413', name: 'Washington Capitals' }
];

function testEndpoint(hostname, eventId, eventName) {
  return new Promise((resolve) => {
    const headers = {
      'X-Identity-Context': `broker-id=${BROKER_ID}`,
      'Accept': 'application/json',
      'apikey': API_KEY  // Using apikey header as per swagger spec
    };

    const options = {
      hostname: hostname,
      port: 443,
      path: `/mercury/v5/ticketgroups?eventId=${eventId}`,
      method: 'GET',
      headers: headers
    };

    console.log(`\n==================================================`);
    console.log(`Testing Event: ${eventName} (ID: ${eventId})`);
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
            console.log('✅ SUCCESS!');
            console.log(`Found ${json.ticketGroups?.length || 0} ticket groups`);

            if (json.ticketGroups?.length > 0) {
              console.log('\n📦 Sample Ticket Group:');
              const sample = json.ticketGroups[0];
              console.log(`  - Section: ${sample.section}`);
              console.log(`  - Row: ${sample.row}`);
              console.log(`  - Quantity: ${sample.quantity}`);
              console.log(`  - Retail Price: $${sample.retailPrice?.value || 'N/A'}`);
              console.log(`  - Wholesale Price: $${sample.wholesalePrice?.value || 'N/A'}`);
            }
          } catch (e) {
            console.log('Response:', data.substring(0, 200));
          }
        } else {
          console.log('❌ Failed');
          console.log('Response:', data.substring(0, 500));
        }
        resolve({ eventId, eventName, status: res.statusCode, hasData: data.includes('ticketGroups') });
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
  console.log('Mercury API Test with CSV Event IDs');
  console.log('Using API Key Authentication');
  console.log('========================================');

  const results = [];

  // Test each event from the CSV
  for (const event of TEST_EVENTS) {
    const result = await testEndpoint('sandbox.tn-apis.com', event.id, event.name);
    results.push(result);
  }

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  results.forEach(r => {
    const status = r.status === 200 ? '✅' : '❌';
    console.log(`${status} ${r.eventName}: Status ${r.status}`);
  });
}

main().catch(console.error);