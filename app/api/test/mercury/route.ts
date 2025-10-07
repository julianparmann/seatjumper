/**
 * Mercury API Test Endpoint - Simplified version
 * GET /api/test/mercury
 *
 * Tests Mercury API sandbox endpoints with manual access token
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {},
    endpoints: {}
  };

  // Get the access token from environment
  const accessToken = process.env.MERCURY_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json({
      error: 'No access token found',
      message: 'Please set MERCURY_ACCESS_TOKEN in .env'
    }, { status: 500 });
  }

  console.log('[Mercury Test] Starting Mercury API tests with manual token...');

  // Test 1: Get Credit Limits (Simple test to verify auth)
  try {
    console.log('[Mercury Test] Testing credit limits endpoint...');
    const response = await fetch('https://sandbox.tn-apis.com/mercury/v5/creditlimits', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Identity-Context': 'broker-id=13870',
        'Accept': 'application/json'
      }
    });

    const responseText = await response.text();
    console.log(`[Mercury Test] Credit limits response status: ${response.status}`);

    if (response.ok) {
      const data = JSON.parse(responseText);
      results.tests.creditLimits = {
        success: true,
        status: response.status,
        data: {
          dailyLimit: data.dailyBuyCreditLimit,
          weeklyLimit: data.weeklyBuyCreditLimit,
          mercuryActive: data.mercuryActive,
          canBuy: data.canBuy
        }
      };
      console.log('[Mercury Test] ✅ Credit limits retrieved successfully');
    } else {
      results.tests.creditLimits = {
        success: false,
        status: response.status,
        error: responseText
      };
      console.log('[Mercury Test] ❌ Credit limits failed:', responseText);
    }
  } catch (error: any) {
    results.tests.creditLimits = {
      success: false,
      error: error.message
    };
    console.error('[Mercury Test] ❌ Credit limits error:', error);
  }

  // Test 2: Get Ticket Groups (requires a valid event ID)
  try {
    console.log('[Mercury Test] Testing ticket groups endpoint...');

    // We need a valid event ID - let's try a common test ID
    const testEventId = '12345'; // This will likely fail without a real event ID

    const response = await fetch(`https://sandbox.tn-apis.com/mercury/v5/ticketgroups?eventId=${testEventId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Identity-Context': 'broker-id=13870',
        'Accept': 'application/json'
      }
    });

    const responseText = await response.text();
    console.log(`[Mercury Test] Ticket groups response status: ${response.status}`);

    if (response.ok) {
      const data = JSON.parse(responseText);
      results.tests.ticketGroups = {
        success: true,
        status: response.status,
        data: {
          totalCount: data.totalCount || 0,
          ticketGroups: data.ticketGroups?.slice(0, 3).map((tg: any) => ({
            id: tg.exchangeTicketGroupId,
            section: tg.seats?.section,
            row: tg.seats?.row,
            quantity: tg.availableQuantity,
            price: tg.unitPrice?.wholesalePrice
          })) || []
        }
      };
      console.log(`[Mercury Test] ✅ Found ${data.totalCount || 0} ticket groups`);
    } else {
      results.tests.ticketGroups = {
        success: false,
        status: response.status,
        error: responseText,
        note: 'This may fail if the test event ID does not exist'
      };
      console.log('[Mercury Test] ❌ Ticket groups failed (expected if event ID invalid)');
    }
  } catch (error: any) {
    results.tests.ticketGroups = {
      success: false,
      error: error.message
    };
    console.error('[Mercury Test] ❌ Ticket groups error:', error);
  }

  // Test 3: Test Catalog API - Get Categories
  try {
    console.log('[Mercury Test] Testing Catalog API categories...');
    const response = await fetch('https://sandbox.tn-apis.com/catalog/v2/categories', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Listing-Context': 'website-config-id=23884', // Catalog uses different config
        'Accept': 'application/json'
      }
    });

    const responseText = await response.text();
    console.log(`[Mercury Test] Categories response status: ${response.status}`);

    if (response.ok) {
      const data = JSON.parse(responseText);
      results.tests.catalogCategories = {
        success: true,
        status: response.status,
        data: {
          count: Array.isArray(data) ? data.length : (data.categories?.length || 0),
          sample: (Array.isArray(data) ? data : (data.categories || [])).slice(0, 5).map((c: any) => ({
            id: c.id,
            name: c.name || c.description
          }))
        }
      };
      console.log('[Mercury Test] ✅ Catalog categories retrieved');
    } else {
      results.tests.catalogCategories = {
        success: false,
        status: response.status,
        error: responseText
      };
      console.log('[Mercury Test] ❌ Catalog categories failed');
    }
  } catch (error: any) {
    results.tests.catalogCategories = {
      success: false,
      error: error.message
    };
    console.error('[Mercury Test] ❌ Catalog categories error:', error);
  }

  // Test 4: Test Catalog API - Search Events
  try {
    console.log('[Mercury Test] Testing Catalog API event search...');
    const searchQuery = 'Lakers'; // Popular search term
    const response = await fetch(`https://sandbox.tn-apis.com/catalog/v2/events?query=${encodeURIComponent(searchQuery)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Listing-Context': 'website-config-id=23884',
        'Accept': 'application/json'
      }
    });

    const responseText = await response.text();
    console.log(`[Mercury Test] Event search response status: ${response.status}`);

    if (response.ok) {
      const data = JSON.parse(responseText);
      results.tests.eventSearch = {
        success: true,
        status: response.status,
        data: {
          count: Array.isArray(data) ? data.length : (data.events?.length || 0),
          sample: (Array.isArray(data) ? data : (data.events || [])).slice(0, 3).map((e: any) => ({
            id: e.id,
            name: e.name,
            date: e.date,
            venue: e.venue?.name
          }))
        }
      };
      console.log(`[Mercury Test] ✅ Found events for "${searchQuery}"`);
    } else {
      results.tests.eventSearch = {
        success: false,
        status: response.status,
        error: responseText
      };
      console.log('[Mercury Test] ❌ Event search failed');
    }
  } catch (error: any) {
    results.tests.eventSearch = {
      success: false,
      error: error.message
    };
    console.error('[Mercury Test] ❌ Event search error:', error);
  }

  // Document working endpoints
  results.endpoints = {
    mercury: {
      base: 'https://sandbox.tn-apis.com/mercury/v5',
      tested: [
        'GET /creditlimits',
        'GET /ticketgroups?eventId={id}'
      ],
      headers: {
        'Authorization': 'Bearer {token}',
        'X-Identity-Context': 'broker-id=13870'
      }
    },
    catalog: {
      base: 'https://sandbox.tn-apis.com/catalog/v2',
      tested: [
        'GET /categories',
        'GET /events?query={search}'
      ],
      headers: {
        'Authorization': 'Bearer {token}',
        'X-Identity-Context': 'website-config-id=23884'
      }
    }
  };

  // Summary
  const allTests = Object.values(results.tests);
  const successCount = allTests.filter((t: any) => t.success).length;
  const totalCount = allTests.length;

  results.summary = {
    passed: successCount,
    failed: totalCount - successCount,
    total: totalCount,
    status: successCount > 0 ? '✅ Mercury API Sandbox connection verified' : '❌ All tests failed',
    tokenExpiry: 'Token expires in ~1 hour, refresh needed after that'
  };

  console.log(`[Mercury Test] Summary: ${successCount}/${totalCount} tests passed`);

  if (successCount > 0) {
    console.log('✅ Mercury API Sandbox verified - At least one endpoint is working');
  }

  return NextResponse.json(results, { status: 200 });
}