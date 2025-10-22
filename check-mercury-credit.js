// Check Mercury API credit limits

async function checkCredit() {
  const MERCURY_ACCESS_TOKEN = "eyJ4NXQiOiJaVGxpWkRreU1HTTJZekE0TldJNU5tTXpNakJsTlRFeU5UTm1ObVUxTnpneE5UTTFORGN4WkEiLCJraWQiOiJNelkwTldReFlqTTNOVEV5WlRCaE5HTmlNbU15WlRaa1pXVXdabU16WmpjMU9HVXlNV0l4WkdFek5tTTJZV0ZtTURBMVltWTJObU15WkRCbU9EQmxPUV9SUzI1NiIsInR5cCI6ImF0K2p3dCIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI0MTcxZmFmYi02NjcxLTRlNDUtYjk3NS1lMmJhMzQ0NmQ2NDUiLCJhdXQiOiJBUFBMSUNBVElPTiIsImF1ZCI6IjJCSTJFRmNsMlV5UEpqRXdtQV9IUnJaMlBnSWEiLCJuYmYiOjE3NjExNzIyNjksImF6cCI6IjJCSTJFRmNsMlV5UEpqRXdtQV9IUnJaMlBnSWEiLCJzY29wZSI6ImRlZmF1bHQiLCJpc3MiOiJodHRwczpcL1wva2V5LW1hbmFnZXIudG4tYXBpcy5jb206NDQzXC9vYXV0aDJcL3Rva2VuIiwiZXhwIjoxNzYxMjA4MjY5LCJpYXQiOjE3NjExNzIyNjksImp0aSI6IjM5OWYzMTE0LTdlMjQtNDcyNS05NDI0LTg2ZDdjZWU1ZmNlMCIsImNsaWVudF9pZCI6IjJCSTJFRmNsMlV5UEpqRXdtQV9IUnJaMlBnSWEifQ.LsCyX9y49u64B8QqWpxMHCig66O51Jua5taWCppEWFlYPqQ9Hfi23NQ0hVBZXPjQ-TzzfPlqgjGw95huNufcMI2ubZPRVgy5NENPp0c6MYxquKcH-t6-grbOvTW5Dt8MoLpQ-XxL90Nv1RlgFoQ78AH03hZgfspfOKtzKhFRjdn_jCbrb3zxooBTSxn8amxsY9TjBtSsYkwodKe4iVM_I2L4dGtz0FJLT2FCbsxpCf3Kr8tvPNoRmuOqwGNJ0tHmFtp5vqdqoGVMX76kNJ1DVYEwNVluYgUOrca5NkLJhOizcnr2HlOKOulL3M8Ahzd2Ov__rfzvVkLzebhZt3DXdQ";
  const MERCURY_API_KEY = "eyJ4NXQiOiJaVGxpWkRreU1HTTJZekE0TldJNU5tTXpNakJsTlRFeU5UTm1ObVUxTnpneE5UTTFORGN4WkE9PSIsImtpZCI6ImdhdGV3YXlfY2VydGlmaWNhdGVfYWxpYXMiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJTZWF0SnVtcGVyLXN0b3JlQGNhcmJvbi5zdXBlciIsImFwcGxpY2F0aW9uIjp7Im93bmVyIjoiU2VhdEp1bXBlci1zdG9yZSIsInRpZXJRdW90YVR5cGUiOm51bGwsInRpZXIiOiI1MFBlck1pbiIsIm5hbWUiOiJUZXN0QXBwbGljYXRpb24iLCJpZCI6MzA0MiwidXVpZCI6ImYxNzFiMWJlLWFkNDAtNGMzYy1iYTViLTlmN2Q2ZDllYjZhZCJ9LCJpc3MiOiJodHRwczpcL1wvY29uc29sZS50bi1hcGlzLmNvbTo0NDNcL29hdXRoMlwvdG9rZW4iLCJ0aWVySW5mbyI6eyJUcmlhbCI6eyJ0aWVyUXVvdGFUeXBlIjoicmVxdWVzdENvdW50IiwiZ3JhcGhRTE1heENvbXBsZXhpdHkiOjAsImdyYXBoUUxNYXhEZXB0aCI6MCwic3RvcE9uUXVvdGFSZWFjaCI6dHJ1ZSwic3Bpa2VBcnJlc3RMaW1pdCI6LTEsInNwaWtlQXJyZXN0VW5pdCI6Ik5BIn19LCJrZXl0eXBlIjoiU0FOREJPWCIsInBlcm1pdHRlZFJlZmVyZXIiOiIiLCJzdWJzY3JpYmVkQVBJcyI6W3sic3Vic2NyaWJlclRlbmFudERvbWFpbiI6ImNhcmJvbi5zdXBlciIsIm5hbWUiOiJDYXRhbG9nQVBJIiwiY29udGV4dCI6IlwvY2F0YWxvZ1wvdjIiLCJwdWJsaXNoZXIiOiJUaWNrZXROZXR3b3JrIiwidmVyc2lvbiI6InYyIiwic3Vic2NyaXB0aW9uVGllciI6IlRyaWFsIn0seyJzdWJzY3JpYmVyVGVuYW50RG9tYWluIjoiY2FyYm9uLnN1cGVyIiwibmFtZSI6Ik1lcmN1cnlBUEkiLCJjb250ZXh0IjoiXC9tZXJjdXJ5XC92NSIsInB1Ymxpc2hlciI6IlRpY2tldE5ldHdvcmsiLCJ2ZXJzaW9uIjoidjUiLCJzdWJzY3JpcHRpb25UaWVyIjoiVHJpYWwifSx7InN1YnNjcmliZXJUZW5hbnREb21haW4iOiJjYXJib24uc3VwZXIiLCJuYW1lIjoiVGlja2V0VmF1bHRBUEkiLCJjb250ZXh0IjoiXC90aWNrZXR2YXVsdFwvdjIiLCJwdWJsaXNoZXIiOiJUaWNrZXROZXR3b3JrIiwidmVyc2lvbiI6InYyIiwic3Vic2NyaXB0aW9uVGllciI6IlRyaWFsIn0seyJzdWJzY3JpYmVyVGVuYW50RG9tYWluIjoiY2FyYm9uLnN1cGVyIiwibmFtZSI6IldlYkhvb2tBUEkiLCJjb250ZXh0IjoiXC93ZWJob29rXC92MSIsInB1Ymxpc2hlciI6IlRpY2tldE5ldHdvcmsiLCJ2ZXJzaW9uIjoidjEiLCJzdWJzY3JpcHRpb25UaWVyIjoiVHJpYWwifV0sInRva2VuX3R5cGUiOiJhcGlLZXkiLCJwZXJtaXR0ZWRJUCI6IiIsImlhdCI6MTc1OTk0MzQ3MSwianRpIjoiYmYwMDhjNGQtOGY0My00NDYxLWFlMWUtOGVlYjFjMjAzOTc4In0=.JBy_I_U_uQmoj364hbc8nms4bc4pX-aC0E9n9BBMnLa9jIwTgCdM-xpaBU8AVCMWUNZOupFJnRHg19qkWTqSgn--AgeAzhjNT8T-KpaXYBIap3LF-iMH9Bj4vy3093cG0_XaUQdDtIi8tH8pRfNKErBZeFzbGc7XTEW8uoieeHWLLP_qAZVudH_xvFH7WWGbu4FFNHfbTywZx1e3fPEdfYLaeXvGsBwe2fO0b3V66CLUeekBaC2eg8jq8nQnzBcoT2gsbdLzzhlnqrL7NHddbsXW0HU7ImsZ_C662FLRJ8vsPDjPpgqNjv1zh64ozHtbMCnQ5Ceq3y7xo-stk2TIiw==";
  const BROKER_ID = "13870";

  console.log('========================================');
  console.log('Mercury API Credit Check');
  console.log('========================================');
  console.log('Broker ID:', BROKER_ID);
  console.log('API URL: https://sandbox.tn-apis.com/mercury/v5/creditlimits');
  console.log('');

  try {
    const response = await fetch('https://sandbox.tn-apis.com/mercury/v5/creditlimits', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MERCURY_ACCESS_TOKEN}`,
        'X-API-Key': MERCURY_API_KEY,
        'X-Identity-Context': `broker-id=${BROKER_ID}`,
        'Accept': 'application/json'
      }
    });

    console.log('Response Status:', response.status, response.statusText);

    const responseText = await response.text();

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('\n✅ Credit Limits Retrieved Successfully!\n');
      console.log('=== DAILY LIMITS ===');
      console.log(`Daily Buy Credit Limit: $${data.dailyBuyCreditLimit?.value?.toFixed(2) || '0.00'} ${data.dailyBuyCreditLimit?.currencyCode || 'USD'}`);
      console.log(`Daily Buy Credit Remaining: $${data.dailyBuyCreditRemaining?.value?.toFixed(2) || '0.00'} ${data.dailyBuyCreditRemaining?.currencyCode || 'USD'}`);

      console.log('\n=== WEEKLY LIMITS ===');
      console.log(`Weekly Buy Credit Limit: $${data.weeklyBuyCreditLimit?.value?.toFixed(2) || '0.00'} ${data.weeklyBuyCreditLimit?.currencyCode || 'USD'}`);
      console.log(`Weekly Buy Credit Remaining: $${data.weeklyBuyCreditRemaining?.value?.toFixed(2) || '0.00'} ${data.weeklyBuyCreditRemaining?.currencyCode || 'USD'}`);

      console.log('\n=== COIN WALLET ===');
      console.log(`Coin Buy Credit Remaining: $${data.coinBuyCreditRemaining?.value?.toFixed(2) || '0.00'} ${data.coinBuyCreditRemaining?.currencyCode || 'USD'}`);
      console.log(`Coin Wallet Enabled: ${data.coinWalletEnabled || false}`);

      console.log('\n=== ACCOUNT STATUS ===');
      console.log(`Mercury Active: ${data.mercuryActive || false}`);
      console.log(`Can Buy: ${data.canBuy || false}`);
      console.log(`Can Sell: ${data.canSell || false}`);
      console.log(`Buy Fee: ${(data.buyFee * 100).toFixed(2)}%`);
      console.log(`Sell Fee: ${(data.sellFee * 100).toFixed(2)}%`);

      console.log('\n=== SUMMARY ===');
      const totalAvailable = Math.min(
        data.dailyBuyCreditRemaining?.value || 0,
        data.weeklyBuyCreditRemaining?.value || 0,
        data.coinBuyCreditRemaining?.value || 0
      );
      console.log(`💰 Total Available Credit: $${totalAvailable.toFixed(2)}`);

      if (totalAvailable === 0) {
        console.log('\n⚠️  WARNING: No credit available for purchases!');
        console.log('This is expected for sandbox accounts. Production accounts will have real credit.');
      }

    } else {
      console.error('❌ Error Response:', responseText);

      // Try to parse error message
      try {
        const error = JSON.parse(responseText);
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Description:', error.description);
      } catch (e) {
        // Not JSON, just show the text
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }

  console.log('\n========================================');
}

checkCredit();