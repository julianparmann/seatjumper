import { prisma } from '@/lib/db';
import { TicketStatus, BreakStatus } from '@prisma/client';

interface PoolBundle {
  ticket: {
    id?: string;
    type?: string;
    individual?: boolean;
    special?: boolean;
    level?: string;
    section?: string;
    row?: string;
    value: number;
  };
  memorabilia: {
    id?: string;
    name: string;
    value: number;
  };
}

/**
 * Mark items as sold when a prize pool is claimed
 * This prevents duplicate wins of 1-of-1 items
 */
export async function markItemsAsSold(poolId: string): Promise<void> {
  // Get the prize pool with its bundles
  const pool = await prisma.prizePool.findUnique({
    where: { id: poolId }
  });

  if (!pool || !pool.bundles) {
    throw new Error('Prize pool not found');
  }

  const bundles = pool.bundles as unknown as PoolBundle[];

  // Track which items to mark as sold
  const ticketGroupIds: string[] = [];
  const cardBreakIds: string[] = [];
  const ticketLevelUpdates: Map<string, number> = new Map();
  const specialPrizeUpdates: Map<string, number> = new Map();
  const cardBreakUpdates: Map<string, number> = new Map();

  // Process each bundle to identify items
  for (const bundle of bundles) {
    // Handle tickets
    if (bundle.ticket) {
      if (bundle.ticket.individual && bundle.ticket.section) {
        // This is a TicketGroup - find and mark as sold
        const ticketGroup = await prisma.ticketGroup.findFirst({
          where: {
            gameId: pool.gameId,
            section: bundle.ticket.section,
            row: bundle.ticket.row || '',
            status: 'AVAILABLE'
          }
        });
        if (ticketGroup) {
          ticketGroupIds.push(ticketGroup.id);
        }
      } else if (bundle.ticket.level) {
        // This is a TicketLevel - decrement quantity
        const level = await prisma.ticketLevel.findFirst({
          where: {
            gameId: pool.gameId,
            level: bundle.ticket.level
          }
        });
        if (level) {
          const current = ticketLevelUpdates.get(level.id) || 0;
          ticketLevelUpdates.set(level.id, current + 1);
        }
      } else if (bundle.ticket.special) {
        // This is a SpecialPrize - decrement quantity
        // We need to match by name since we don't store the ID
        const prize = await prisma.specialPrize.findFirst({
          where: {
            gameId: pool.gameId,
            name: bundle.ticket.value.toString() // Using value as a fallback identifier
          }
        });
        if (prize) {
          const current = specialPrizeUpdates.get(prize.id) || 0;
          specialPrizeUpdates.set(prize.id, current + 1);
        }
      }
    }

    // Handle memorabilia
    if (bundle.memorabilia) {
      if (bundle.memorabilia.id) {
        // Use ID directly if available
        const current = cardBreakUpdates.get(bundle.memorabilia.id) || 0;
        cardBreakUpdates.set(bundle.memorabilia.id, current + 1);
      } else if (bundle.memorabilia.name) {
        // Fallback to name matching for legacy data
        const cardBreak = await prisma.cardBreak.findFirst({
          where: {
            gameId: pool.gameId,
            breakName: bundle.memorabilia.name,
            status: 'AVAILABLE'
          }
        });
        if (cardBreak) {
          const current = cardBreakUpdates.get(cardBreak.id) || 0;
          cardBreakUpdates.set(cardBreak.id, current + 1);
        }
      }
    }
  }

  // Execute all updates in a transaction
  await prisma.$transaction(async (tx) => {
    // Mark TicketGroups as SOLD
    if (ticketGroupIds.length > 0) {
      await tx.ticketGroup.updateMany({
        where: {
          id: { in: ticketGroupIds }
        },
        data: {
          status: TicketStatus.SOLD
        }
      });
    }

    // Decrement CardBreak quantities
    for (const [breakId, decrementBy] of cardBreakUpdates) {
      const cardBreak = await tx.cardBreak.findUnique({
        where: { id: breakId }
      });

      if (cardBreak) {
        if (cardBreak.quantity <= decrementBy) {
          // If quantity will be 0 or less, mark as SOLD
          await tx.cardBreak.update({
            where: { id: breakId },
            data: {
              quantity: 0,
              status: BreakStatus.SOLD
            }
          });
        } else {
          // Otherwise just decrement
          await tx.cardBreak.update({
            where: { id: breakId },
            data: {
              quantity: {
                decrement: decrementBy
              }
            }
          });
        }
      }
    }

    // Decrement TicketLevel quantities
    for (const [levelId, decrementBy] of ticketLevelUpdates) {
      await tx.ticketLevel.update({
        where: { id: levelId },
        data: {
          quantity: {
            decrement: decrementBy
          }
        }
      });
    }

    // Decrement SpecialPrize quantities
    for (const [prizeId, decrementBy] of specialPrizeUpdates) {
      await tx.specialPrize.update({
        where: { id: prizeId },
        data: {
          quantity: {
            decrement: decrementBy
          }
        }
      });
    }
  });

  console.log(`Marked items as sold for pool ${poolId}:`, {
    ticketGroups: ticketGroupIds.length,
    cardBreaks: cardBreakUpdates.size,
    ticketLevels: ticketLevelUpdates.size,
    specialPrizes: specialPrizeUpdates.size
  });
}

/**
 * Check if there's enough inventory available for a game
 */
export async function hasAvailableInventory(gameId: string, bundleSize: number): Promise<boolean> {
  const [ticketGroups, ticketLevels, specialPrizes, cardBreaks] = await Promise.all([
    prisma.ticketGroup.count({
      where: {
        gameId,
        status: 'AVAILABLE',
        availableUnits: {
          array_contains: bundleSize
        }
      }
    }),
    prisma.ticketLevel.findMany({
      where: {
        gameId,
        quantity: { gt: 0 }
      }
    }),
    prisma.specialPrize.findMany({
      where: {
        gameId,
        quantity: { gt: 0 }
      }
    }),
    prisma.cardBreak.findMany({
      where: {
        gameId,
        status: 'AVAILABLE',
        quantity: { gt: 0 },
        availableUnits: {
          array_contains: bundleSize
        }
      }
    })
  ]);

  // Calculate total available tickets
  const totalTickets = ticketGroups +
    ticketLevels.reduce((sum, level) => sum + level.quantity, 0) +
    specialPrizes.reduce((sum, prize) => sum + prize.quantity, 0);

  // Calculate total available memorabilia
  const totalMemorabilia = cardBreaks.reduce((sum, item) => sum + item.quantity, 0);

  // Need at least bundleSize of both tickets and memorabilia
  return totalTickets >= bundleSize && totalMemorabilia >= bundleSize;
}