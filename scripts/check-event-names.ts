import { mercuryAPI } from '../lib/api/mercury';

async function checkEventNames() {
  console.log('Testing Mercury API with new access token...\n');
  console.log('=====================================\n');

  try {
    // Test 1: Search for events in the catalog
    console.log('1. SEARCHING CATALOG API FOR EVENTS');
    console.log('-----------------------------------');
    const events = await mercuryAPI.searchEvents('2025');
    console.log(`Found ${events.length} events in catalog\n`);

    // Display first 3 events as examples
    console.log('Sample events from catalog:');
    events.slice(0, 3).forEach((event: any, index: number) => {
      console.log(`\nEvent ${index + 1}:`);
      console.log(`  ID: ${event.id}`);
      console.log(`  Name: ${event.name}`);
      console.log(`  Date: ${event.date?.datetime || event.date || 'Unknown'}`);
      console.log(`  Venue: ${event.venue?.name || event.venue || 'Unknown'}`);
      if (event.venue?.city && event.venue?.state) {
        console.log(`  Location: ${event.venue.city}, ${event.venue.state}`);
      }
    });

    console.log('\n=====================================\n');

    // Test 2: Check inventory for specific events
    console.log('2. CHECKING MERCURY INVENTORY API');
    console.log('----------------------------------');
    const testEventIds = ['5204545', '5207741', '5205180', '5206940'];

    for (const eventId of testEventIds) {
      console.log(`\nEvent ID: ${eventId}`);

      try {
        // Get event details from catalog
        const eventDetails = await mercuryAPI.getEvent(eventId);
        console.log(`  Name: ${eventDetails?.name || 'Unknown'}`);

        // Get inventory from Mercury
        const inventory = await mercuryAPI.getInventory({ eventId });
        console.log(`  Inventory: ${inventory?.length || 0} ticket groups available`);

        if (inventory && inventory.length > 0) {
          // Show sample ticket info
          const sampleTicket = inventory[0];
          console.log(`  Sample ticket:`);
          console.log(`    Section: ${sampleTicket.section}`);
          console.log(`    Row: ${sampleTicket.row}`);
          console.log(`    Price: $${sampleTicket.price}`);
          console.log(`    Quantity: ${sampleTicket.quantity}`);

          // Show section distribution
          const sections = new Set(inventory.map((t: any) => t.section));
          console.log(`  Sections available: ${Array.from(sections).join(', ')}`);
        }
      } catch (error) {
        console.log(`  Error: ${error instanceof Error ? error.message : 'Failed to fetch'}`);
      }
    }

    console.log('\n=====================================\n');

    // Test 3: Show detailed structure of Mercury ticket group
    console.log('3. MERCURY TICKET GROUP STRUCTURE');
    console.log('----------------------------------');
    const sampleInventory = await mercuryAPI.getInventory({ eventId: '5204545' });
    if (sampleInventory && sampleInventory.length > 0) {
      console.log('Sample ticket group structure:');
      console.log(JSON.stringify(sampleInventory[0], null, 2));
    }

  } catch (error) {
    console.error('Error testing Mercury API:', error);
  }
}

checkEventNames().catch(console.error);