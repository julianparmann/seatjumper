import { prisma } from '@/lib/db';

async function checkPoolContents() {
  const gameId = 'cmfzmkcnt0027v7gfzkiq2upa';

  const pools = await prisma.prizePool.findMany({
    where: { gameId, bundleSize: 2 },
    take: 5
  });

  pools.forEach((pool, index) => {
    console.log(`\n=== Pool ${index + 1} ===`);
    console.log(`Total Value: ${pool.totalValue}`);
    console.log(`Total Price: ${pool.totalPrice}`);

    const bundles = pool.bundles as any[];
    bundles.forEach((bundle, bIndex) => {
      console.log(`\nBundle ${bIndex + 1}:`);
      const ticket = bundle.ticket;
      if (ticket.level) {
        console.log(`  Type: Ticket Level`);
        console.log(`  Level: ${ticket.level}`);
        console.log(`  Name: ${ticket.levelName}`);
        console.log(`  Value: ${ticket.value}`);
      } else if (ticket.individual) {
        console.log(`  Type: Ticket Group`);
        console.log(`  Section: ${ticket.section}`);
        console.log(`  Row: ${ticket.row}`);
        console.log(`  Value: ${ticket.value}`);
      } else if (ticket.special) {
        console.log(`  Type: Special Prize`);
        console.log(`  Name: ${ticket.name}`);
        console.log(`  Value: ${ticket.value}`);
      }
    });
  });

  await prisma.$disconnect();
}

checkPoolContents();