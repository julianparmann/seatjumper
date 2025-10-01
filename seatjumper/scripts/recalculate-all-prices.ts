import { prisma } from '@/lib/db';
import { calculateBundlePricing } from '@/lib/pricing';

async function recalculateAllGamePrices() {
  console.log('Starting price recalculation for all games...');

  try {
    // Fetch all games with their inventory
    const games = await prisma.dailyGame.findMany({
      include: {
        ticketGroups: true,
        ticketLevels: true,
        specialPrizes: true,
        cardBreaks: true
      }
    });

    console.log(`Found ${games.length} games to recalculate`);

    for (const game of games) {
      console.log(`\nProcessing: ${game.eventName}`);

      // Calculate pricing with 30% margin
      const pricing = calculateBundlePricing(
        game.ticketGroups,
        game.cardBreaks,
        30, // 30% margin as requested
        game.ticketLevels,
        game.specialPrizes
      );

      // Update the game with new pricing
      await prisma.dailyGame.update({
        where: { id: game.id },
        data: {
          avgTicketPrice: pricing.avgTicketPrice,
          avgBreakValue: pricing.avgBreakValue,
          spinPricePerBundle: pricing.spinPricePerBundle
        }
      });

      console.log(`  Event: ${game.eventName}`);
      console.log(`  Date: ${game.eventDate}`);
      console.log(`  Tickets: ${pricing.availableTickets} available`);
      console.log(`  Memorabilia: ${pricing.availableBreaks} available`);
      console.log(`  Avg Ticket Price: $${pricing.avgTicketPrice.toFixed(2)}`);
      console.log(`  Avg Break Value: $${pricing.avgBreakValue.toFixed(2)}`);
      console.log(`  Bundle Value (before margin): $${pricing.totalBundleValue.toFixed(2)}`);
      console.log(`  Bundle Price (with 30% margin): $${pricing.spinPricePerBundle.toFixed(2)}`);
    }

    console.log('\n✅ All game prices have been recalculated with 30% margin');
  } catch (error) {
    console.error('Error recalculating prices:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
recalculateAllGamePrices();