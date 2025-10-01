import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAvailableUnits() {
  try {
    console.log('Starting to fix availableUnits for ticket groups...');

    // Get all ticket groups
    const ticketGroups = await prisma.ticketGroup.findMany({
      where: {
        status: 'AVAILABLE'
      }
    });

    console.log(`Found ${ticketGroups.length} available ticket groups`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const group of ticketGroups) {
      // Determine correct availableUnits based on quantity
      let correctAvailableUnits: number[] = [];

      switch (group.quantity) {
        case 1:
          correctAvailableUnits = [1];
          break;
        case 2:
          correctAvailableUnits = [2]; // Strict: pairs stay together
          break;
        case 3:
          correctAvailableUnits = [3];
          break;
        case 4:
          correctAvailableUnits = [4]; // Strict: quads stay together
          break;
        default:
          // For quantities > 4, allow all bundle sizes up to the quantity
          correctAvailableUnits = [1, 2, 3, 4].filter(size => size <= group.quantity);
          break;
      }

      // Check if update is needed
      const currentUnits = group.availableUnits as number[] || [];
      const needsUpdate = JSON.stringify(currentUnits) !== JSON.stringify(correctAvailableUnits);

      if (needsUpdate) {
        await prisma.ticketGroup.update({
          where: { id: group.id },
          data: { availableUnits: correctAvailableUnits }
        });
        console.log(`Updated ${group.section} Row ${group.row}: Qty ${group.quantity} -> availableUnits: [${correctAvailableUnits}]`);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`\n✅ Complete!`);
    console.log(`- Updated: ${updatedCount} ticket groups`);
    console.log(`- Already correct: ${skippedCount} ticket groups`);

    // Now recalculate prices for all games to ensure bundle pricing is correct
    console.log('\nRecalculating bundle prices for all games...');

    const response = await fetch('http://localhost:3000/api/admin/recalculate-prices', {
      method: 'POST'
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Recalculated prices for ${result.gamesUpdated} games`);
    } else {
      console.log('⚠️ Failed to recalculate prices - you may need to do this manually');
    }

  } catch (error) {
    console.error('Error fixing availableUnits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixAvailableUnits();