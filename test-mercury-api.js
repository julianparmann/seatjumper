#!/usr/bin/env node

// Test Mercury API with different configurations
const https = require('https');

// Configuration from .env
const ACCESS_TOKEN = process.env.MERCURY_ACCESS_TOKEN || 'eyJ4NXQiOiJaVGxpWkRreU1HTTJZekE0TldJNU5tTXpNakJsTlRFeU5UTm1ObVUxTnpneE5UTTFORGN4WkEiLCJraWQiOiJNelkwTldReFlqTTNOVEV5WlRCaE5HTmlNbU15WlRaa1pXVXdabU16WmpjMU9HVXlNV0l4WkdFek5tTTJZV0ZtTURBMVltWTJObU15WkRCbU9EQmxPUV9SUzI1NiIsInR5cCI6ImF0K2p3dCIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI0MTcxZmFmYi02NjcxLTRlNDUtYjk3NS1lMmJhMzQ0NmQ2NDUiLCJhdXQiOiJBUFBMSUNBVElPTiIsImF1ZCI6IjJCSTJFRmNsMlV5UEpqRXdtQV9IUnJaMlBnSWEiLCJuYmYiOjE3NjExNzIyNjksImF6cCI6IjJCSTJFRmNsMlV5UEpqRXdtQV9IUnJaMlBnSWEiLCJzY29wZSI6ImRlZmF1bHQiLCJpc3MiOiJodHRwczpcL1wva2V5LW1hbmFnZXIudG4tYXBpcy5jb206NDQzXC9vYXV0aDJcL3Rva2VuIiwiZXhwIjoxNzYxMjA4MjY5LCJpYXQiOjE3NjExNzIyNjksImp0aSI6IjM5OWYzMTE0LTdlMjQtNDcyNS05NDI0LTg2ZDdjZWU1ZmNlMCIsImNsaWVudF9pZCI6IjJCSTJFRmNsMlV5UEpqRXdtQV9IUnJaMlBnSWEifQ.LsCyX9y49u64B8QqWpxMHCig66O51Jua5taWCppEWFlYPqQ9Hfi23NQ0hVBZXPjQ-TzzfPlqgjGw95huNufcMI2ubZPRVgy5NENPp0c6MYxquKcH-t6-grbOvTW5Dt8MoLpQ-XxL90Nv1RlgFoQ78AH03hZgfspfOKtzKhFRjdn_jCbrb3zxooBTSxn8amxsY9TjBtSsYkwodKe4iVM_I2L4dGtz0FJLT2FCbsxpCf3Kr8tvPNoRmuOqwGNJ0tHmFtp5vqdqoGVMX76kNJ1DVYEwNVluYgUOrca5NkLJhOizcnr2HlOKOulL3M8Ahzd2Ov__rfzvVkLzebhZt3DXdQ';

const API_KEY = 'eyJ4NXQiOiJaVGxpWkRreU1HTTJZekE0TldJNU5tTXpNakJsTlRFeU5UTm1ObVUxTnpneE5UTTFORGN4WkE9PSIsImtpZCI6ImdhdGV3YXlfY2VydGlmaWNhdGVfYWxpYXMiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJTZWF0SnVtcGVyLXN0b3JlQGNhcmJvbi5zdXBlciIsImFwcGxpY2F0aW9uIjp7Im93bmVyIjoiU2VhdEp1bXBlci1zdG9yZSIsInRpZXJRdW90YVR5cGUiOm51bGwsInRpZXIiOiI1MFBlck1pbiIsIm5hbWUiOiJUZXN0QXBwbGljYXRpb24iLCJpZCI6MzA0MiwidXVpZCI6ImYxNzFiMWJlLWFkNDAtNGMzYy1iYTViLTlmN2Q2ZDllYjZhZCJ9LCJpc3MiOiJodHRwczpcL1wvY29uc29sZS50bi1hcGlzLmNvbTo0NDNcL29hdXRoMlwvdG9rZW4iLCJ0aWVySW5mbyI6eyJUcmlhbCI6eyJ0aWVyUXVvdGFUeXBlIjoicmVxdWVzdENvdW50IiwiZ3JhcGhRTE1heENvbXBsZXhpdHkiOjAsImdyYXBoUUxNYXhEZXB0aCI6MCwic3RvcE9uUXVvdGFSZWFjaCI6dHJ1ZSwic3Bpa2VBcnJlc3RMaW1pdCI6LTEsInNwaWtlQXJyZXN0VW5pdCI6Ik5BIn19LCJrZXl0eXBlIjoiU0FOREJPWCIsInBlcm1pdHRlZFJlZmVyZXIiOiIiLCJzdWJzY3JpYmVkQVBJcyI6W3sic3Vic2NyaWJlclRlbmFudERvbWFpbiI6ImNhcmJvbi5zdXBlciIsIm5hbWUiOiJDYXRhbG9nQVBJIiwiY29udGV4dCI6IlwvY2F0YWxvZ1wvdjIiLCJwdWJsaXNoZXIiOiJUaWNrZXROZXR3b3JrIiwidmVyc2lvbiI6InYyIiwic3Vic2NyaXB0aW9uVGllciI6IlRyaWFsIn0seyJzdWJzY3JpYmVyVGVuYW50RG9tYWluIjoiY2FyYm9uLnN1cGVyIiwibmFtZSI6Ik1lcmN1cnlBUEkiLCJjb250ZXh0IjoiXC9tZXJjdXJ5XC92NSIsInB1Ymxpc2hlciI6IlRpY2tldE5ldHdvcmsiLCJ2ZXJzaW9uIjoidjUiLCJzdWJzY3JpcHRpb25UaWVyIjoiVHJpYWwifSx7InN1YnNjcmliZXJUZW5hbnREb21haW4iOiJjYXJib24uc3VwZXIiLCJuYW1lIjoiVGlja2V0VmF1bHRBUEkiLCJjb250ZXh0IjoiXC90aWNrZXR2YXVsdFwvdjIiLCJwdWJsaXNoZXIiOiJUaWNrZXROZXR3b3JrIiwidmVyc2lvbiI6InYyIiwic3Vic2NyaXB0aW9uVGllciI6IlRyaWFsIn0seyJzdWJzY3JpYmVyVGVuYW50RG9tYWluIjoiY2FyYm9uLnN1cGVyIiwibmFtZSI6IldlYkhvb2tBUEkiLCJjb250ZXh0IjoiXC93ZWJob29rXC92MSIsInB1Ymxpc2hlciI6IlRpY2tldE5ldHdvcmsiLCJ2ZXJzaW9uIjoidjEiLCJzdWJzY3JpcHRpb25UaWVyIjoiVHJpYWwifV0sInRva2VuX3R5cGUiOiJhcGlLZXkiLCJwZXJtaXR0ZWRJUCI6IiIsImlhdCI6MTc1OTk0MzQ3MSwianRpIjoiYmYwMDhjNGQtOGY0My00NDYxLWFlMWUtOGVlYjFjMjAzOTc4In0=.JBy_I_U_uQmoj364hbc8nms4bc4pX-aC0E9n9BBMnLa9jIwTgCdM-xpaBU8AVCMWUNZOupFJnRHg19qkWTqSgn--AgeAzhjNT8T-KpaXYBIap3LF-iMH9Bj4vy3093cG0_XaUQdDtIi8tH8pRfNKErBZeFzbGc7XTEW8uoieeHWLLP_qAZVudH_xvFH7WWGbu4FFNHfbTywZx1e3fPEdfYLaeXvGsBwe2fO0b3V66CLUeekBaC2eg8jq8nQnzBcoT2gsbdLzzhlnqrL7NHddbsXW0HU7ImsZ_C662FLRJ8vsPDjPpgqNjv1zh64ozHtbMCnQ5Ceq3y7xo-stk2TIiw==';

const BROKER_ID = '13870';

// Test different event IDs
const TEST_EVENT_IDS = [
  '5206689', // From earlier tests
  '5202661',
  '4494581',
  '5204950',
  '1234567', // Random ID
  '1000000'  // Another random ID
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
        console.log('Response Headers:', res.headers);
        console.log('Response Body:', data);
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

async function testConfigurations() {
  console.log('Testing Mercury API with different configurations...\n');

  // Test 1: OAuth Bearer Token (current implementation)
  console.log('\n### Test 1: OAuth Bearer Token ###');
  await makeRequest('/mercury/v5/ticketgroups?eventId=5206689', {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'X-Identity-Context': `broker-id=${BROKER_ID}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  });

  // Test 2: API Key as Bearer Token
  console.log('\n### Test 2: API Key as Bearer ###');
  await makeRequest('/mercury/v5/ticketgroups?eventId=5206689', {
    'Authorization': `Bearer ${API_KEY}`,
    'X-Identity-Context': `broker-id=${BROKER_ID}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  });

  // Test 3: API Key in custom header
  console.log('\n### Test 3: API Key in X-API-Key header ###');
  await makeRequest('/mercury/v5/ticketgroups?eventId=5206689', {
    'X-API-Key': API_KEY,
    'X-Identity-Context': `broker-id=${BROKER_ID}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  });

  // Test 4: apikey as Bearer (lowercase)
  console.log('\n### Test 4: apikey as Bearer ###');
  await makeRequest('/mercury/v5/ticketgroups?eventId=5206689', {
    'Authorization': `apikey ${API_KEY}`,
    'X-Identity-Context': `broker-id=${BROKER_ID}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  });

  // Test 5: Test without eventId to see error message
  console.log('\n### Test 5: No eventId parameter ###');
  await makeRequest('/mercury/v5/ticketgroups', {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'X-Identity-Context': `broker-id=${BROKER_ID}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  });

  // Test 6: Test with website-config-id instead of broker-id
  console.log('\n### Test 6: Website Config ID instead of Broker ID ###');
  await makeRequest('/mercury/v5/ticketgroups?eventId=5206689', {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'X-Identity-Context': 'website-config-id=27735',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  });
}

testConfigurations().catch(console.error);