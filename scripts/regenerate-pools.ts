import { prisma } from '@/lib/db';
import { generatePrizePools } from '@/lib/services/prize-pool-service';

async function regeneratePools() {
  const gameId = 'cmfzmkcnt0027v7gfzkiq2upa';

  console.log('Deleting all existing pools...');
  const deleted = await prisma.prizePool.deleteMany({
    where: { gameId }
  });
  console.log(`Deleted ${deleted.count} pools`);

  console.log('Generating fresh pools with updated inventory...');
  await generatePrizePools(gameId, 5);

  console.log('Done! Pools regenerated.');

  // Check what was generated
  const newPools = await prisma.prizePool.findMany({
    where: { gameId },
    select: {
      bundleSize: true,
      status: true,
      bundles: true
    }
  });

  // Count how many pools have ticket levels
  let poolsWithTicketLevels = 0;
  newPools.forEach(pool => {
    const bundles = pool.bundles as any[];
    const hasTicketLevel = bundles.some(b => b.ticket?.level);
    if (hasTicketLevel) poolsWithTicketLevels++;
  });

  console.log(`Generated ${newPools.length} pools`);
  console.log(`Pools with ticket levels: ${poolsWithTicketLevels}`);

  await prisma.$disconnect();
}

regeneratePools();