async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/inventory');

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }

    const games = await response.json();
    console.log('Total games:', games.length);

    const gameWithBreaks = games.find((g: any) => g.id === 'cmflh28x60000jpc3pakgkodd');
    if (gameWithBreaks) {
      console.log('\nGame "ttt" found:');
      console.log('  ID:', gameWithBreaks.id);
      console.log('  Name:', gameWithBreaks.eventName);
      console.log('  Card Breaks:', gameWithBreaks.cardBreaks?.length || 0);
      console.log('  Ticket Groups:', gameWithBreaks.ticketGroups?.length || 0);

      if (gameWithBreaks.cardBreaks && gameWithBreaks.cardBreaks.length > 0) {
        console.log('\nFirst 3 card breaks:');
        gameWithBreaks.cardBreaks.slice(0, 3).forEach((cb: any) => {
          console.log(`  - ${cb.teamName || cb.breakName}: $${cb.breakValue} (${cb.status})`);
        });
      }
    } else {
      console.log('\nGame "ttt" not found in API response');
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI();