import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  try {
    // Get all card breaks for the game
    const breaks = await prisma.cardBreak.findMany({
      where: { gameId: 'cmflh28x60000jpc3pakgkodd' },
      orderBy: [
        { teamName: 'asc' },
        { createdAt: 'asc' } // Keep the oldest one
      ]
    });

    // Group by team name
    const teamGroups: { [key: string]: any[] } = {};
    breaks.forEach(breakItem => {
      const team = breakItem.teamName || 'Unknown';
      if (!teamGroups[team]) {
        teamGroups[team] = [];
      }
      teamGroups[team].push(breakItem);
    });

    // Delete duplicates (keep the first one)
    let deletedCount = 0;
    for (const [team, teamBreaks] of Object.entries(teamGroups)) {
      if (teamBreaks.length > 1) {
        // Keep the first one, delete the rest
        const toDelete = teamBreaks.slice(1);
        const deleteIds = toDelete.map(b => b.id);

        await prisma.cardBreak.deleteMany({
          where: {
            id: { in: deleteIds }
          }
        });

        deletedCount += toDelete.length;
        console.log(`Deleted ${toDelete.length} duplicates for: ${team}`);
      }
    }

    console.log(`\nTotal duplicates deleted: ${deletedCount}`);

    // Verify
    const remaining = await prisma.cardBreak.count({
      where: { gameId: 'cmflh28x60000jpc3pakgkodd' }
    });
    console.log(`Remaining card breaks: ${remaining}`);

  } catch (error) {
    console.error('Error cleaning duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicates();