import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mercuryAPI } from '@/lib/api/mercury';
import { mercuryIntegrationService } from '@/lib/services/mercury-integration-service';
import { getSportFromMercuryEvent } from '@/lib/utils/sport-mapper';
import { getStandardMemorabiliaForSport } from '@/lib/config/standard-memorabilia';
import { TierLevel, Sport } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    console.log(`[Sync] Starting sync for Mercury event ${eventId}`);

    // Check if DailyGame already exists
    const existingGame = await prisma.dailyGame.findUnique({
      where: { id: eventId },
      include: {
        ticketGroups: true,
        cardBreaks: true,
      }
    });

    if (existingGame && existingGame.ticketGroups.length > 0) {
      console.log(`[Sync] Game ${eventId} already exists with ${existingGame.ticketGroups.length} ticket groups`);
      return NextResponse.json({
        gameId: existingGame.id,
        message: 'Game already synced',
        ticketGroups: existingGame.ticketGroups.length
      });
    }

    // Fetch event details from Mercury Catalog API
    console.log(`[Sync] Fetching event details from Mercury`);
    const mercuryEvent = await mercuryAPI.getEvent(eventId);

    if (!mercuryEvent) {
      return NextResponse.json(
        { error: 'Event not found in Mercury' },
        { status: 404 }
      );
    }

    // Fetch ticketgroups from Mercury API
    console.log(`[Sync] Fetching ticketgroups for event ${eventId}`);

    const ticketGroups = await mercuryAPI.getInventory({ eventId });

    // Log the raw response for debugging
    console.log(`[Sync] Mercury API response for event ${eventId}:`, {
      hasData: !!ticketGroups,
      count: ticketGroups?.length || 0,
      sample: ticketGroups?.length > 0 ? ticketGroups[0] : null
    });

    if (!ticketGroups || ticketGroups.length === 0) {
      console.warn(`[Sync] No ticketgroups found for event ${eventId} in Mercury sandbox`);

      // Still create the game entry with event details, but without inventory
      // This allows the game to be visible even if sandbox has no test data
      return NextResponse.json({
        warning: 'No inventory available in Mercury sandbox',
        eventId: eventId,
        message: 'The Mercury API authentication is working correctly, but the sandbox environment has no test inventory data for this event.',
        details: {
          event: mercuryEvent.name,
          venue: typeof mercuryEvent.venue === 'object' ? mercuryEvent.venue.name : mercuryEvent.venue,
          date: mercuryEvent.date
        },
        suggestion: 'In production, real events will have inventory. For development, you may need to contact TicketNetwork for test event IDs with inventory.'
      }, { status: 200 }); // Return 200 since this is expected in sandbox
    }

    console.log(`[Sync] Found ${ticketGroups.length} ticketgroups`);

    // Sort tickets by price for tier categorization
    const sortedTickets = [...ticketGroups].sort((a, b) => a.price - b.price);

    // Calculate tier thresholds
    // Gold: Top 15% (most expensive)
    // Red: Middle 35%
    // Blue: Bottom 50% (least expensive)
    const totalTickets = sortedTickets.length;
    const blueThreshold = Math.floor(totalTickets * 0.50);
    const redThreshold = Math.floor(totalTickets * 0.85);

    // Assign tiers based on position in sorted array
    const tieredTickets = sortedTickets.map((ticket, index) => {
      let tier: TierLevel;
      let tierPriority: number;

      if (index < blueThreshold) {
        tier = TierLevel.VIP_ITEM;
        tierPriority = 3;
      } else if (index < redThreshold) {
        tier = TierLevel.GOLD_LEVEL;
        tierPriority = 2;
      } else {
        tier = TierLevel.UPPER_DECK;
        tierPriority = 1;
      }

      return { ...ticket, tier, tierPriority };
    });

    // Calculate average prices per tier
    const blueTierTickets = tieredTickets.filter(t => t.tier === TierLevel.VIP_ITEM);
    const redTierTickets = tieredTickets.filter(t => t.tier === TierLevel.GOLD_LEVEL);
    const goldTierTickets = tieredTickets.filter(t => t.tier === TierLevel.UPPER_DECK);

    const avgBluePrice = blueTierTickets.reduce((sum, t) => sum + t.price, 0) / (blueTierTickets.length || 1);
    const avgRedPrice = redTierTickets.reduce((sum, t) => sum + t.price, 0) / (redTierTickets.length || 1);
    const avgGoldPrice = goldTierTickets.reduce((sum, t) => sum + t.price, 0) / (goldTierTickets.length || 1);

    // Detect sport from event
    const sport = getSportFromMercuryEvent(mercuryEvent) as Sport;
    const memorabiliaValue = getStandardMemorabiliaForSport(sport).value;

    // Calculate jump prices (avg price + memorabilia) * 1.3 for 30% margin
    const margin = 1.30;
    const spinPrice1x = Math.round((avgBluePrice + memorabiliaValue) * margin);
    const spinPrice2x = Math.round((avgBluePrice + memorabiliaValue) * 2 * margin);
    const spinPrice3x = Math.round((avgBluePrice + memorabiliaValue) * 3 * margin);
    const spinPrice4x = Math.round((avgBluePrice + memorabiliaValue) * 4 * margin);

    // Parse event date
    let eventDate: Date;
    if (mercuryEvent.date && typeof mercuryEvent.date === 'object' && 'datetime' in mercuryEvent.date) {
      eventDate = new Date((mercuryEvent.date as any).datetime);
    } else if (mercuryEvent.date) {
      eventDate = new Date(mercuryEvent.date as string);
    } else {
      eventDate = new Date();
    }

    // Extract venue information safely with fallbacks
    let venueName = 'Venue TBA';
    let venueCity = 'City TBA';
    let venueState = 'State TBA';

    if (mercuryEvent.venue) {
      if (typeof mercuryEvent.venue === 'object') {
        venueName = mercuryEvent.venue.name || 'Venue TBA';
        venueCity = mercuryEvent.venue.city || 'City TBA';
        venueState = mercuryEvent.venue.state || 'State TBA';
      } else if (typeof mercuryEvent.venue === 'string') {
        venueName = mercuryEvent.venue;
      }
    }

    // Create or update DailyGame
    const game = await prisma.dailyGame.upsert({
      where: { id: eventId },
      update: {
        eventName: mercuryEvent.name || 'Event TBA',
        eventDate,
        venue: venueName,
        city: venueCity,
        state: venueState,
        sport,
        avgTicketPrice: sortedTickets.reduce((sum, t) => sum + t.price, 0) / sortedTickets.length,
        avgBreakValue: memorabiliaValue,
        spinPricePerBundle: spinPrice1x,
        spinPrice1x,
        spinPrice2x,
        spinPrice3x,
        spinPrice4x,
        isActive: true,
        status: 'ACTIVE',
      },
      create: {
        id: eventId,
        eventName: mercuryEvent.name || 'Event TBA',
        eventDate,
        venue: venueName,
        city: venueCity,
        state: venueState,
        sport,
        avgTicketPrice: sortedTickets.reduce((sum, t) => sum + t.price, 0) / sortedTickets.length,
        avgBreakValue: memorabiliaValue,
        spinPricePerBundle: spinPrice1x,
        spinPrice1x,
        spinPrice2x,
        spinPrice3x,
        spinPrice4x,
        isActive: true,
        status: 'ACTIVE',
      }
    });

    console.log(`[Sync] Created/Updated DailyGame ${game.id}`);

    // Delete existing ticket groups if any (for re-sync)
    if (existingGame) {
      await prisma.ticketGroup.deleteMany({
        where: { gameId: eventId }
      });
      console.log(`[Sync] Deleted old ticket groups`);
    }

    // Create TicketGroup records
    const ticketGroupData = tieredTickets.map(ticket => ({
      gameId: game.id,
      section: ticket.section || 'General',
      row: ticket.row || '',
      pricePerSeat: ticket.price,
      quantity: ticket.quantity || 1,
      tierLevel: ticket.tier,
      tierPriority: ticket.tierPriority,
      status: 'AVAILABLE' as const,
      notes: `Mercury ID: ${ticket.id}`,
      availableUnits: [1], // Default to 1 unit available
      availablePacks: [ticket.tier.toLowerCase()], // Match tier to pack type
    }));

    await prisma.ticketGroup.createMany({
      data: ticketGroupData
    });

    console.log(`[Sync] Created ${ticketGroupData.length} ticket groups`);

    // Create some mock CardBreaks for memorabilia (simplified for now)
    const cardBreaks = [
      {
        gameId: game.id,
        breakName: `${sport} Memorabilia Pack`,
        breakValue: memorabiliaValue,
        breakDateTime: eventDate,
        category: 'MEMORABILIA',
        breakType: getStandardMemorabiliaForSport(sport).category,
        breaker: 'SeatJumper',
        status: 'AVAILABLE' as const,
      }
    ];

    await prisma.cardBreak.createMany({
      data: cardBreaks
    });

    console.log(`[Sync] Created ${cardBreaks.length} card breaks`);

    return NextResponse.json({
      gameId: game.id,
      message: 'Successfully synced Mercury event',
      stats: {
        ticketGroups: ticketGroupData.length,
        blueTickets: blueTierTickets.length,
        redTickets: redTierTickets.length,
        goldTickets: goldTierTickets.length,
        avgPrices: {
          blue: Math.round(avgBluePrice),
          red: Math.round(avgRedPrice),
          gold: Math.round(avgGoldPrice),
        },
        jumpPrices: {
          '1x': spinPrice1x,
          '2x': spinPrice2x,
          '3x': spinPrice3x,
          '4x': spinPrice4x,
        }
      }
    });

  } catch (error) {
    console.error('[Sync] Error syncing Mercury event:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync event',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}