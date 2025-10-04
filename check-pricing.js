const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPricing() {
  try {
    const game = await prisma.dailyGame.findUnique({
      where: {
        id: 'cmg8gfbzo0005l204yo24n795'
      },
      select: {
        id: true,
        eventName: true,
        spinPrice1x: true,
        spinPrice2x: true,
        spinPrice3x: true,
        spinPrice4x: true
      }
    });

    console.log('Current game pricing:');
    console.log(game);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPricing();