const axios = require('axios');
require('dotenv').config();

async function testMercuryDetailed() {
  const token = process.env.MERCURY_ACCESS_TOKEN;
  const brokerId = process.env.MERCURY_BROKER_ID;

  // Test with Boston Bruins event that has 111 ticket groups
  const eventId = '5204545';

  try {
    // Get ticket groups
    const response = await axios.get(
      `https://sandbox.tn-apis.com/mercury/v5/ticketgroups`,
      {
        params: { eventId },
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Identity-Context': `broker-id=${brokerId}`
        }
      }
    );

    console.log('Total ticket groups found:', response.data.ticketGroups?.length || 0);
    console.log('\nFirst 3 ticket groups structure:');

    const groups = response.data.ticketGroups?.slice(0, 3) || [];
    groups.forEach((group, idx) => {
      console.log(`\n=== Ticket Group ${idx + 1} ===`);
      console.log(JSON.stringify(group, null, 2));
    });

    // Also get event details from catalog
    const catalogResponse = await axios.get(
      `https://sandbox.tn-apis.com/catalog/v2/events/${eventId}`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Identity-Context': `broker-id=${brokerId}`
        }
      }
    );

    console.log('\n=== Event Details from Catalog ===');
    console.log(JSON.stringify(catalogResponse.data, null, 2));

  } catch (error) {
    console.error('Error:', error.response?.status || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testMercuryDetailed();