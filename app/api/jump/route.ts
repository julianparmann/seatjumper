import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to jump' }, { status: 401 });
    }

    const { gameId, quantity = 1, preferAdjacent = true } = await req.json();

    if (!gameId) {
      return NextResponse.json({ error: 'Game ID required' }, { status: 400 });
    }

    // Start a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get the game with available inventory
      const game = await tx.dailyGame.findUnique({
        where: { id: gameId },
        include: {
          ticketGroups: {
            where: {
              quantity: { gt: 0 },
              status: 'AVAILABLE'
            }
          },
          cardBreaks: {
            where: {
              status: 'AVAILABLE'
            }
          }
        }
      });

      if (!game) {
        throw new Error('Game not found');
      }

      // Check if there's enough inventory for bundles
      const availableTickets = game.ticketGroups.reduce((sum, group) => sum + group.quantity, 0);
      const availableBreaks = game.cardBreaks.length;

      if (availableTickets < quantity) {
        throw new Error(`Only ${availableTickets} tickets available, but ${quantity} requested`);
      }

      if (availableBreaks < quantity) {
        throw new Error(`Only ${availableBreaks} card breaks available, but ${quantity} bundles requested`);
      }

      const bundles = [];
      let ticketsAssigned = [];
      let breaksAssigned = [];

      // If preferAdjacent and quantity > 1, try to find adjacent seats
      if (preferAdjacent && quantity > 1) {
        // Find a group with enough adjacent seats
        const adjacentGroup = game.ticketGroups.find(group => group.quantity >= quantity);

        if (adjacentGroup) {
          // Assign adjacent tickets from the same group
          for (let i = 0; i < quantity; i++) {
            ticketsAssigned.push({
              groupId: adjacentGroup.id,
              section: adjacentGroup.section,
              row: adjacentGroup.row,
              value: adjacentGroup.pricePerSeat,
              seatNumber: i + 1 // Track seat position for display
            });
          }

          // Update inventory for adjacent group
          await tx.ticketGroup.update({
            where: { id: adjacentGroup.id },
            data: {
              quantity: {
                decrement: quantity
              }
            }
          });
        }
      }

      // If no adjacent seats found or not preferred, select randomly
      if (ticketsAssigned.length === 0) {
        // Build array of all available tickets with their group info
        const ticketPool: any[] = [];
        game.ticketGroups.forEach(group => {
          for (let i = 0; i < group.quantity; i++) {
            ticketPool.push({
              groupId: group.id,
              section: group.section,
              row: group.row,
              value: group.pricePerSeat
            });
          }
        });

        // Randomly select tickets
        for (let i = 0; i < quantity; i++) {
          const randomIndex = Math.floor(Math.random() * ticketPool.length);
          const selectedTicket = ticketPool.splice(randomIndex, 1)[0];
          ticketsAssigned.push(selectedTicket);
        }

        // Update inventory for each ticket group
        const groupUpdates = ticketsAssigned.reduce((acc: any, ticket) => {
          acc[ticket.groupId] = (acc[ticket.groupId] || 0) + 1;
          return acc;
        }, {});

        for (const [groupId, count] of Object.entries(groupUpdates)) {
          await tx.ticketGroup.update({
            where: { id: groupId },
            data: {
              quantity: {
                decrement: count as number
              }
            }
          });
        }
      }

      // Randomly select card breaks for each bundle
      const shuffledBreaks = [...game.cardBreaks].sort(() => Math.random() - 0.5);

      for (let i = 0; i < quantity; i++) {
        // Each bundle gets 1-3 breaks
        const numBreaks = Math.min(
          Math.floor(availableBreaks / quantity),
          Math.floor(Math.random() * 3) + 1
        );

        const bundleBreaks = shuffledBreaks.splice(0, numBreaks);
        breaksAssigned.push(...bundleBreaks);

        bundles.push({
          ticket: {
            section: ticketsAssigned[i].section,
            row: ticketsAssigned[i].row,
            value: ticketsAssigned[i].value,
            seatNumber: ticketsAssigned[i].seatNumber
          },
          breaks: bundleBreaks.map(b => ({
            teamName: b.teamName || b.breakName,
            value: b.breakValue,
            imageUrl: b.imageUrl,
            description: b.description,
            itemType: b.itemType || 'break'
          }))
        });
      }

      // Mark selected card breaks as SOLD
      await tx.cardBreak.updateMany({
        where: {
          id: {
            in: breaksAssigned.map(b => b.id)
          }
        },
        data: {
          status: 'SOLD'
        }
      });

      // Calculate total value
      const totalValue = bundles.reduce((sum, bundle) => {
        const ticketValue = bundle.ticket.value;
        const breaksValue = bundle.breaks.reduce((s: number, b: any) => s + b.value, 0);
        return sum + ticketValue + breaksValue;
      }, 0);

      // Create SpinResult record
      const spinResult = await tx.spinResult.create({
        data: {
          gameId,
          userId: session.user.id,
          quantity,
          totalPrice: game.spinPricePerBundle * quantity,
          totalValue,
          adjacentSeats: preferAdjacent && ticketsAssigned.every(t => t.groupId === ticketsAssigned[0].groupId),
          bundles: {
            create: bundles.map(bundle => ({
              ticketSection: bundle.ticket.section,
              ticketRow: bundle.ticket.row,
              ticketValue: bundle.ticket.value,
              ticketQuantity: 1,
              breaks: bundle.breaks,
              bundleValue: bundle.ticket.value + bundle.breaks.reduce((s: number, b: any) => s + b.value, 0)
            }))
          }
        },
        include: {
          bundles: true
        }
      });

      // Return the bundle details
      return {
        quantity,
        bundles,
        totalValue,
        adjacentSeats: spinResult.adjacentSeats,
        spinId: spinResult.id
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Spin error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process spin',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}