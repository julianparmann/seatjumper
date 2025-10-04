// Using built-in fetch in Node 18+

async function testCheckout() {
  try {
    // First, we need to authenticate - let's use the existing session
    // For testing, we'll create a checkout request directly
    const response = await fetch('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // We'll need to add auth headers - for now let's see what error we get
      },
      body: JSON.stringify({
        gameId: 'cmg8gfbzo0005l204yo24n795',
        quantity: 1,
        selectedLevels: [],
        selectedPack: 'blue'
      })
    });

    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text);

    if (!response.ok) {
      try {
        const error = JSON.parse(text);
        console.log('Error details:', error);
      } catch (e) {
        console.log('Raw error:', text);
      }
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testCheckout();