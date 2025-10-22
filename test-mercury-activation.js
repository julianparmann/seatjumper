const axios = require('axios');
require('dotenv').config();

// Events from the new CSV
const TEST_EVENTS = [
  { id: '5202661', name: 'Cirque du Soleil' },
  { id: '4494581', name: 'Moulin Rouge Virtual' },
  { id: '5204950', name: 'Norfolk Admirals' },
  { id: '5204545', name: 'Boston Bruins' },
  { id: '5205614', name: 'New Jersey Devils' },
  { id: '5204413', name: 'Washington Capitals' }
];

async function testMercury() {
  const token = process.env.MERCURY_ACCESS_TOKEN;
  const brokerId = process.env.MERCURY_BROKER_ID;

  console.log('Testing Mercury API with broker ID:', brokerId);
  console.log('Token preview:', token.substring(0, 50) + '...');
  console.log('\n========================================\n');

  for (const event of TEST_EVENTS) {
    try {
      const response = await axios.get(
        `https://sandbox.tn-apis.com/mercury/v5/ticketgroups`,
        {
          params: { eventId: event.id },
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Identity-Context': `broker-id=${brokerId}`
          }
        }
      );

      const ticketCount = response.data.ticketGroups?.length || 0;
      console.log(`✅ ${event.name} (${event.id}): ${ticketCount} ticket groups found`);

      if (ticketCount > 0) {
        const firstGroup = response.data.ticketGroups[0];
        console.log(`   Section: ${firstGroup.section || 'N/A'}, Row: ${firstGroup.row || 'N/A'}, Price: $${firstGroup.wholesalePrice || 'N/A'}`);
      }
    } catch (error) {
      console.log(`❌ ${event.name} (${event.id}): ${error.response?.status || error.message}`);
    }
  }

  console.log('\n========================================');
  console.log('Mercury API Activation Test Complete!');

  // Also test the credit limits to confirm activation
  console.log('\nChecking account status...');
  try {
    const creditResponse = await axios.get(
      'https://sandbox.tn-apis.com/mercury/v5/creditlimits',
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Identity-Context': `broker-id=${brokerId}`
        }
      }
    );

    console.log('Account Status:', creditResponse.data.mercuryActive ? '✅ ACTIVE' : '❌ NOT ACTIVE');
    console.log('Credit Limit:', creditResponse.data.currentLimit);
  } catch (error) {
    console.log('Error checking account:', error.response?.status || error.message);
  }
}

testMercury();