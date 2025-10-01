import { prisma } from '@/lib/db';

async function checkInventory() {
  const gameId = 'cmfzmkcnt0027v7gfzkiq2upa';

  const game = await prisma.dailyGame.findUnique({
    where: { id: gameId },
    include: {
      ticketLevels: true,
      ticketGroups: true,
      specialPrizes: true
    }
  });

  if (!game) {
    console.log('Game not found');
    return;
  }

  console.log('=== TICKET LEVELS ===');
  game.ticketLevels.forEach(level => {
    console.log(`Level: ${level.levelName}, Quantity: ${level.quantity}, Value: ${level.pricePerSeat}, AvailableUnits: ${JSON.stringify(level.availableUnits)}`);
  });

  console.log('\n=== TICKET GROUPS ===');
  console.log(`Total: ${game.ticketGroups.length} groups`);
  const availableGroups = game.ticketGroups.filter(g => g.status === 'AVAILABLE');
  console.log(`Available: ${availableGroups.length} groups`);

  // Check available units for ticket groups
  const groupsWith2x = availableGroups.filter(g => {
    const units = g.availableUnits as number[] || [1,2,3,4];
    return units.includes(2);
  });
  console.log(`Groups available for 2x bundles: ${groupsWith2x.length}`);

  console.log('\n=== SPECIAL PRIZES ===');
  game.specialPrizes.forEach(prize => {
    console.log(`Prize: ${prize.name}, Quantity: ${prize.quantity}, Value: ${prize.value}, AvailableUnits: ${JSON.stringify(prize.availableUnits)}`);
  });

  await prisma.$disconnect();
}

checkInventory();