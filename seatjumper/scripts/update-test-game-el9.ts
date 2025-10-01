import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateTestGameEL9() {
  try {
    // Use the game ID directly
    const gameId = 'cmfzmkcnt0027v7gfzkiq2upa';

    // Verify the game exists
    const testGame = await prisma.dailyGame.findUnique({
      where: {
        id: gameId
      }
    });

    if (!testGame) {
      console.error('Game not found with ID:', gameId);
      return;
    }

    console.log('Found game:', testGame.eventName, '- ID:', testGame.id);

    // Update EL9 ticket with the Cloudinary URL
    const cloudinaryUrl = 'https://res.cloudinary.com/dpmlr8kkx/image/upload/v1758826709/logeLounge_fnolvn.webp';

    const result = await prisma.ticketGroup.updateMany({
      where: {
        gameId: gameId,
        section: 'EL9'
      },
      data: {
        seatViewUrl: cloudinaryUrl
      }
    });

    if (result.count > 0) {
      console.log(`Successfully updated ${result.count} EL9 ticket(s) with new image URL`);
    } else {
      console.log('No EL9 tickets found for this game');

      // Let's check what sections exist
      const tickets = await prisma.ticketGroup.findMany({
        where: {
          gameId: gameId
        },
        select: {
          section: true,
          row: true,
          pricePerSeat: true,
          seatViewUrl: true
        }
      });

      console.log(`Available tickets in game "${testGame.eventName}":`);
      tickets.forEach(t => {
        console.log(`  Section: ${t.section}, Row: ${t.row}, Price: $${t.pricePerSeat}, Image: ${t.seatViewUrl ? 'Yes' : 'No'}`);
      });
    }
  } catch (error) {
    console.error('Error updating EL9:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTestGameEL9();