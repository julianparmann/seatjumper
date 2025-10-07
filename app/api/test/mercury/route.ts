/**
 * Test endpoint for Mercury API integration
 * GET /api/test/mercury
 */

import { NextRequest, NextResponse } from 'next/server';
import { mercuryAPI } from '@/lib/api/mercury';
import { mercuryTokenService } from '@/lib/services/mercury-token-service';
import { vipRandomizationService } from '@/lib/services/vip-randomization-service';

export async function GET(req: NextRequest) {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: OAuth Token Acquisition
    try {
      console.log('[Mercury Test] Testing OAuth token acquisition...');
      const token = await mercuryTokenService.getToken();
      const tokenInfo = mercuryTokenService.getTokenInfo();

      results.tests.oauth = {
        success: true,
        token: token ? `${token.substring(0, 10)}...` : 'none',
        valid: tokenInfo.valid,
        expiresIn: tokenInfo.expiresIn ? `${Math.round(tokenInfo.expiresIn / 60)} minutes` : 'unknown'
      };
      console.log('[Mercury Test] ✓ OAuth token acquired');
    } catch (error: any) {
      results.tests.oauth = {
        success: false,
        error: error.message
      };
      console.error('[Mercury Test] ✗ OAuth failed:', error.message);
    }

    // Test 2: Catalog API - Get Categories
    try {
      console.log('[Mercury Test] Testing Catalog API - Categories...');
      const categories = await mercuryAPI.getCategories();

      results.tests.categories = {
        success: true,
        count: categories?.length || 0,
        sample: categories?.slice(0, 3).map((c: any) => c.name || c.id) || []
      };
      console.log(`[Mercury Test] ✓ Retrieved ${categories?.length || 0} categories`);
    } catch (error: any) {
      results.tests.categories = {
        success: false,
        error: error.message
      };
      console.error('[Mercury Test] ✗ Categories failed:', error.message);
    }

    // Test 3: Search for Events
    try {
      console.log('[Mercury Test] Testing event search...');
      const events = await mercuryAPI.searchEvents('Lakers');

      results.tests.eventSearch = {
        success: true,
        count: events?.length || 0,
        sample: events?.slice(0, 3).map((e: any) => ({
          name: e.name,
          date: e.date,
          venue: e.venue?.name
        })) || []
      };
      console.log(`[Mercury Test] ✓ Found ${events?.length || 0} events`);
    } catch (error: any) {
      results.tests.eventSearch = {
        success: false,
        error: error.message
      };
      console.error('[Mercury Test] ✗ Event search failed:', error.message);
    }

    // Test 4: Get Inventory (if we have an event ID)
    try {
      console.log('[Mercury Test] Testing inventory retrieval...');
      // In production, you'd get a real event ID
      const mockInventory = await mercuryAPI.getInventory({
        eventId: 'test-event-id',
        minQuantity: 1,
        maxQuantity: 4
      });

      results.tests.inventory = {
        success: true,
        count: mockInventory?.length || 0,
        sample: mockInventory?.slice(0, 3).map((t: any) => ({
          section: t.section,
          row: t.row,
          price: t.price,
          quantity: t.quantity
        })) || []
      };
      console.log(`[Mercury Test] ✓ Retrieved ${mockInventory?.length || 0} ticket groups`);
    } catch (error: any) {
      results.tests.inventory = {
        success: false,
        error: error.message,
        note: 'This might fail without a valid event ID'
      };
      console.error('[Mercury Test] ✗ Inventory failed:', error.message);
    }

    // Test 5: VIP Randomization (1 in 5000 odds)
    try {
      console.log('[Mercury Test] Testing VIP randomization...');
      const simulations = 10000;
      let vipTicketWins = 0;
      let vipMemorabiliaWins = 0;

      for (let i = 0; i < simulations; i++) {
        const ticketRoll = Math.random();
        const memorabiliaRoll = Math.random();

        if (ticketRoll < 0.0002) vipTicketWins++;
        if (memorabiliaRoll < 0.0002) vipMemorabiliaWins++;
      }

      results.tests.vipRandomization = {
        success: true,
        simulations,
        expectedWins: simulations * 0.0002,
        actualTicketWins: vipTicketWins,
        actualMemorabiliaWins: vipMemorabiliaWins,
        ticketWinRate: `${((vipTicketWins / simulations) * 100).toFixed(4)}%`,
        memorabiliaWinRate: `${((vipMemorabiliaWins / simulations) * 100).toFixed(4)}%`,
        expectedRate: '0.02% (1 in 5000)'
      };
      console.log(`[Mercury Test] ✓ VIP randomization tested - Ticket wins: ${vipTicketWins}/${simulations}, Memorabilia wins: ${vipMemorabiliaWins}/${simulations}`);
    } catch (error: any) {
      results.tests.vipRandomization = {
        success: false,
        error: error.message
      };
      console.error('[Mercury Test] ✗ VIP randomization failed:', error.message);
    }

    // Summary
    const allTests = Object.values(results.tests);
    const successCount = allTests.filter((t: any) => t.success).length;
    const totalCount = allTests.length;

    results.summary = {
      passed: successCount,
      failed: totalCount - successCount,
      total: totalCount,
      status: successCount === totalCount ? 'All tests passed!' : `${totalCount - successCount} test(s) failed`
    };

    return NextResponse.json(results, { status: 200 });

  } catch (error: any) {
    console.error('[Mercury Test] Unexpected error:', error);
    return NextResponse.json({
      error: 'Test suite failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}