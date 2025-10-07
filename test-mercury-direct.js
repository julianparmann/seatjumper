#!/usr/bin/env node

/**
 * Direct test of Mercury API with access token
 */

const accessToken = "eyJ4NXQiOiJaVGxpWkRreU1HTTJZekE0TldJNU5tTXpNakJsTlRFeU5UTm1ObVUxTnpneE5UTTFORGN4WkEiLCJraWQiOiJNelkwTldReFlqTTNOVEV5WlRCaE5HTmlNbU15WlRaa1pXVXdabU16WmpjMU9HVXlOV0l4WkdFek5tTTJZV0ZtTURBMVltWTJObU15WkRCbU9EQmxPUV9SUzI1NiIsInR5cCI6ImF0K2p3dCIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI0MTcxZmFmYi02NjcxLTRlNDUtYjk3NS1lMmJhMzQ0NmQ2NDUiLCJhdXQiOiJBUFBMSUNBVElPTiIsImF1ZCI6IjJCSTJFRmNsMlV5UEpqRXdtQV9IUnJaMlBnSWEiLCJuYmYiOjE3NTk4NTQ3MjAsImF6cCI6IjJCSTJFRmNsMlV5UEpqRXdtQV9IUnJaMlBnSWEiLCJzY29wZSI6ImRlZmF1bHQiLCJpc3MiOiJodHRwczpcL1wva2V5LW1hbmFnZXIudG4tYXBpcy5jb206NDQzXC9vYXV0aDJcL3Rva2VuIiwiZXhwIjoxNzU5ODU4MzIwLCJpYXQiOjE3NTk4NTQ3MjAsImp0aSI6IjhlOTlhMjE0LWI3OWItNDNhZi1iMGE5LTJiMzZkZWIwOGM0MCIsImNsaWVudF9pZCI6IjJCSTJFRmNsMlV5UEpqRXdtQV9IUnJaMlBnSWEifQ.TQabpoY0_OKZmHpCj3mpk_Bc1aysdFjQJkh9awLoc48gShogETGjvGagiwY-S_9ft1J8m5JVz67OlZgLVFz0aTKcEdj_vG-0g3zRdpLcCYgb2xaBOe8UhG0Hxb2ZRQIB0ZIMumWKJkMyxHpySa6NW1vy9rv1E16It9KGus1XUovjQi6pk5kKdZbWIu4s4fWm_axOqbam3CQyMFu2gKl2LSR8jMCa4htkwN4AE-kcCgk6GJ8DXFPWYMNszfomVkJu8lQ6nWOa3yzUIUPstpGOjxTP-e1CBBAJm7ktRe1HeaiQ8D4UnHvBKo3HYDv_ZjK9iwiXdF5S1DS3oTbnjDerVA";

console.log("Testing Mercury API with manual token...\n");

async function testMercuryAPI() {
  const results = {
    tests: {},
    summary: {}
  };

  // Test 1: Mercury Credit Limits
  try {
    console.log("1. Testing Mercury Credit Limits...");
    const response = await fetch('https://sandbox.tn-apis.com/mercury/v5/creditlimits', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Identity-Context': 'broker-id=13870',
        'Accept': 'application/json'
      }
    });

    console.log(`   Status: ${response.status}`);
    const text = await response.text();

    if (response.ok) {
      const data = JSON.parse(text);
      console.log("   ✅ SUCCESS - Credit limits retrieved");
      console.log(`   Daily limit: ${JSON.stringify(data.dailyBuyCreditLimit)}`);
      console.log(`   Mercury active: ${data.mercuryActive}`);
      results.tests.creditLimits = { success: true, status: response.status };
    } else {
      console.log(`   ❌ FAILED: ${text.substring(0, 200)}`);
      results.tests.creditLimits = { success: false, status: response.status, error: text };
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.tests.creditLimits = { success: false, error: error.message };
  }

  console.log();

  // Test 2: Catalog Categories
  try {
    console.log("2. Testing Catalog Categories...");
    const response = await fetch('https://sandbox.tn-apis.com/catalog/v2/categories', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Listing-Context': 'website-config-id=23884',
        'Accept': 'application/json'
      }
    });

    console.log(`   Status: ${response.status}`);
    const text = await response.text();

    if (response.ok) {
      const data = JSON.parse(text);
      const count = Array.isArray(data) ? data.length : (data.categories?.length || 0);
      console.log(`   ✅ SUCCESS - Found ${count} categories`);
      if (count > 0) {
        const sample = (Array.isArray(data) ? data : data.categories || []).slice(0, 3);
        sample.forEach(c => console.log(`      - ${c.name || c.description || c.id}`));
      }
      results.tests.categories = { success: true, status: response.status, count };
    } else {
      console.log(`   ❌ FAILED: ${text.substring(0, 200)}`);
      results.tests.categories = { success: false, status: response.status, error: text };
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.tests.categories = { success: false, error: error.message };
  }

  console.log();

  // Test 3: Search Events
  try {
    console.log("3. Testing Event Search (Lakers)...");
    const response = await fetch('https://sandbox.tn-apis.com/catalog/v2/events?query=Lakers', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Listing-Context': 'website-config-id=23884',
        'Accept': 'application/json'
      }
    });

    console.log(`   Status: ${response.status}`);
    const text = await response.text();

    if (response.ok) {
      const data = JSON.parse(text);
      const events = Array.isArray(data) ? data : (data.events || []);
      console.log(`   ✅ SUCCESS - Found ${events.length} events`);
      events.slice(0, 3).forEach(e => {
        console.log(`      - ${e.name} (ID: ${e.id})`);
      });
      results.tests.events = { success: true, status: response.status, count: events.length };

      // Store first event ID for ticket group test
      if (events.length > 0) {
        results.firstEventId = events[0].id;
      }
    } else {
      console.log(`   ❌ FAILED: ${text.substring(0, 200)}`);
      results.tests.events = { success: false, status: response.status, error: text };
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.tests.events = { success: false, error: error.message };
  }

  console.log();

  // Test 4: Get Ticket Groups (if we have an event ID)
  if (results.firstEventId) {
    try {
      console.log(`4. Testing Ticket Groups for event ${results.firstEventId}...`);
      const response = await fetch(`https://sandbox.tn-apis.com/mercury/v5/ticketgroups?eventId=${results.firstEventId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Identity-Context': 'broker-id=13870',
          'Accept': 'application/json'
        }
      });

      console.log(`   Status: ${response.status}`);
      const text = await response.text();

      if (response.ok) {
        const data = JSON.parse(text);
        console.log(`   ✅ SUCCESS - Found ${data.totalCount || 0} ticket groups`);
        if (data.ticketGroups && data.ticketGroups.length > 0) {
          data.ticketGroups.slice(0, 2).forEach(tg => {
            console.log(`      - Section ${tg.seats?.section}, Row ${tg.seats?.row}, Qty: ${tg.availableQuantity}, Price: $${tg.unitPrice?.wholesalePrice?.value}`);
          });
        }
        results.tests.ticketGroups = { success: true, status: response.status, count: data.totalCount };
      } else {
        console.log(`   ❌ FAILED: ${text.substring(0, 200)}`);
        results.tests.ticketGroups = { success: false, status: response.status, error: text };
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      results.tests.ticketGroups = { success: false, error: error.message };
    }
  } else {
    console.log("4. Skipping Ticket Groups test (no event ID available)");
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  const successCount = Object.values(results.tests).filter(t => t.success).length;
  const totalCount = Object.keys(results.tests).length;

  console.log(`SUMMARY: ${successCount}/${totalCount} tests passed`);

  if (successCount > 0) {
    console.log("\n✅ Mercury API Sandbox verified - Connection successful!");
    console.log("\nWorking endpoints:");
    console.log("- Mercury: https://sandbox.tn-apis.com/mercury/v5");
    console.log("- Catalog: https://sandbox.tn-apis.com/catalog/v2");
    console.log("\nRequired headers:");
    console.log("- Authorization: Bearer <token>");
    console.log("- X-Identity-Context: broker-id=13870 (Mercury) or website-config-id=23884 (Catalog)");
  } else {
    console.log("\n❌ All tests failed - please check the access token");
  }

  return results;
}

// Run the tests
testMercuryAPI().catch(console.error);