import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCreateGame() {
  try {
    console.log('Testing game creation...');

    const game = await prisma.dailyGame.create({
      data: {
        eventName: 'Test Game',
        eventDate: new Date('2024-12-25'),
        venue: 'Test Venue',
        city: 'Las Vegas',
        state: 'NV',
        sport: 'NFL',
        avgTicketPrice: 100,
        spinPricePerBundle: 135,
        status: 'DRAFT',
      }
    });

    console.log('✅ Game created successfully:', game.id);

    // Now try with a ticket group
    const gameWithTickets = await prisma.dailyGame.create({
      data: {
        eventName: 'Test Game with Tickets',
        eventDate: new Date('2024-12-26'),
        venue: 'Test Venue',
        city: 'Las Vegas',
        state: 'NV',
        sport: 'NBA',
        avgTicketPrice: 150,
        spinPricePerBundle: 202.5,
        status: 'DRAFT',
        ticketGroups: {
          create: {
            section: '102',
            row: 'G',
            quantity: 2,
            pricePerSeat: 150,
            ticketType: 'Mobile Transfer'
          }
        }
      },
      include: {
        ticketGroups: true
      }
    });

    console.log('✅ Game with tickets created:', gameWithTickets.id);
    console.log('  Ticket groups:', gameWithTickets.ticketGroups.length);

  } catch (error) {
    console.error('❌ Error creating game:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreateGame();