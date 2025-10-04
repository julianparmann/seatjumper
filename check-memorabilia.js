const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMemorabilia() {
  try {
    const memorabilia = await prisma.cardBreak.findMany({
      where: {
        gameId: 'cmg8gfbzo0005l204yo24n795',
        status: 'AVAILABLE'
      },
      select: {
        id: true,
        breakName: true,
        availableUnits: true,
        availablePacks: true,
        quantity: true
      },
      take: 5
    });

    console.log('Sample memorabilia items:');
    memorabilia.forEach(item => {
      console.log({
        name: item.breakName,
        availableUnits: item.availableUnits,
        availablePacks: item.availablePacks,
        quantity: item.quantity
      });
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMemorabilia();