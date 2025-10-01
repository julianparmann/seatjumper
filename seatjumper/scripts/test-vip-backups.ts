import { prisma } from '@/lib/db';
import { promoteVipBackup, checkAndPromoteVipBackups, decrementVipInventory } from '@/lib/services/vip-tier-service';

async function testVipBackupSystem() {
  const gameId = 'cmfzmkcnt0027v7gfzkiq2upa'; // Replace with actual game ID

  console.log('\n=== VIP Tier Backup System Test ===\n');

  // 1. Check current VIP items
  console.log('1. Current VIP Items:');
  const vipLevels = await prisma.ticketLevel.findMany({
    where: {
      gameId,
      tierLevel: 'VIP_ITEM'
    },
    orderBy: { tierPriority: 'asc' }
  });

  vipLevels.forEach(level => {
    console.log(`   - ${level.levelName}: Priority ${level.tierPriority}, Quantity: ${level.quantity}`);
  });

  const vipGroups = await prisma.ticketGroup.findMany({
    where: {
      gameId,
      tierLevel: 'VIP_ITEM'
    },
    orderBy: { tierPriority: 'asc' }
  });

  vipGroups.forEach(group => {
    console.log(`   - ${group.section} ${group.row}: Priority ${group.tierPriority}, Status: ${group.status}`);
  });

  // 2. Simulate depleting a primary VIP item
  const primaryVip = vipLevels.find(l => l.tierPriority === 1 && l.quantity > 0);

  if (primaryVip) {
    console.log(`\n2. Simulating depletion of primary VIP: ${primaryVip.levelName}`);

    // Set quantity to 0 to simulate depletion
    await prisma.ticketLevel.update({
      where: { id: primaryVip.id },
      data: { quantity: 0 }
    });

    // 3. Trigger backup promotion
    console.log('\n3. Triggering backup promotion...');
    await promoteVipBackup(gameId, primaryVip.id);

    // 4. Check updated priorities
    console.log('\n4. Updated VIP Items after promotion:');
    const updatedVipLevels = await prisma.ticketLevel.findMany({
      where: {
        gameId,
        tierLevel: 'VIP_ITEM'
      },
      orderBy: { tierPriority: 'asc' }
    });

    updatedVipLevels.forEach(level => {
      const wasPromoted = level.tierPriority === 1 &&
                         vipLevels.find(l => l.id === level.id)?.tierPriority !== 1;
      console.log(`   - ${level.levelName}: Priority ${level.tierPriority}, Quantity: ${level.quantity}${wasPromoted ? ' (PROMOTED!)' : ''}`);
    });

    // 5. Restore original state (optional)
    console.log('\n5. Restoring original state...');
    await prisma.ticketLevel.update({
      where: { id: primaryVip.id },
      data: { quantity: 10 } // Restore some quantity
    });
  } else {
    console.log('\nNo primary VIP items found with quantity > 0');
  }

  // 6. Test auto-check function
  console.log('\n6. Testing auto-check function...');
  await checkAndPromoteVipBackups(gameId);
  console.log('   Auto-check completed');

  await prisma.$disconnect();
}

testVipBackupSystem();