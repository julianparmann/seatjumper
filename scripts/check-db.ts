import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    // Get all games with their card breaks
    const games = await prisma.dailyGame.findMany({
      include: {
        cardBreaks: true,
        ticketGroups: true
      }
    });

    console.log('\n=== DATABASE CHECK ===\n');

    for (const game of games) {
      console.log(`Game: ${game.eventName}`);
      console.log(`  ID: ${game.id}`);
      console.log(`  Status: ${game.status}`);
      console.log(`  Ticket Groups: ${game.ticketGroups.length}`);
      console.log(`  Card Breaks: ${game.cardBreaks.length}`);

      if (game.cardBreaks.length > 0) {
        console.log('\n  Card Break Details:');
        const available = game.cardBreaks.filter(b => b.status === 'AVAILABLE');
        const soldOut = game.cardBreaks.filter(b => b.status === 'SOLD_OUT');

        console.log(`    - Available: ${available.length}`);
        console.log(`    - Sold Out: ${soldOut.length}`);

        // Show first 5 breaks
        console.log('\n    Sample breaks:');
        game.cardBreaks.slice(0, 5).forEach(breakItem => {
          console.log(`      • ${breakItem.teamName || breakItem.breakName} - $${breakItem.breakValue} (${breakItem.status})`);
        });

        if (game.cardBreaks.length > 5) {
          console.log(`      ... and ${game.cardBreaks.length - 5} more`);
        }
      }

      console.log('\n-----------------------------------\n');
    }

    // Check for orphaned breaks
    const orphanedBreaks = await prisma.cardBreak.findMany({
      where: {
        gameId: null
      }
    });

    if (orphanedBreaks.length > 0) {
      console.log(`⚠️  Found ${orphanedBreaks.length} orphaned card breaks without a game!`);
    }

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();