import { prisma } from '@/lib/db';
import { PoolStatus } from '@prisma/client';

/**
 * Fisher-Yates shuffle algorithm for true randomness
 * This ensures every permutation has equal probability
 */
function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface BundleItem {
  type: 'ticket' | 'ticketGroup' | 'special' | 'memorabilia';
  id: string;
  name?: string;
  value: number;
  details: any;
}

interface GeneratedBundle {
  ticket: any;
  memorabilia: any;
}

/**
 * Generate prize pools for a game for all bundle sizes
 */
export async function generatePrizePools(gameId: string, poolsPerSize: number = 5) {
  console.log(`Generating ${poolsPerSize} prize pools for each bundle size for game ${gameId}`);

  // Generate for each bundle size (1, 2, 3, 4)
  const bundleSizes = [1, 2, 3, 4];

  for (const bundleSize of bundleSizes) {
    await generatePoolsForBundleSize(gameId, bundleSize, poolsPerSize);
  }

  // Also generate and store best prizes
  await storeBestPrizes(gameId);
}

/**
 * Generate pools for a specific bundle size
 */
async function generatePoolsForBundleSize(gameId: string, bundleSize: number, count: number) {
  // Mark any existing available pools as stale
  await prisma.prizePool.updateMany({
    where: {
      gameId,
      bundleSize,
      status: PoolStatus.AVAILABLE
    },
    data: {
      status: PoolStatus.STALE
    }
  });

  // Fetch the game with ONLY AVAILABLE inventory to prevent duplicate wins
  const game = await prisma.dailyGame.findUnique({
    where: { id: gameId },
    include: {
      ticketLevels: {
        where: {
          quantity: { gt: 0 },  // Only levels with inventory
          OR: [
            { tierLevel: { not: 'VIP_ITEM' } },  // Include all non-VIP items
            {
              AND: [
                { tierLevel: 'VIP_ITEM' },
                { tierPriority: 1 }  // Only include primary VIP items (not backups)
              ]
            }
          ]
        }
      },
      ticketGroups: {
        where: {
          status: 'AVAILABLE',  // Only available (not SOLD/RESERVED)
          OR: [
            { tierLevel: { not: 'VIP_ITEM' } },  // Include all non-VIP items
            {
              AND: [
                { tierLevel: 'VIP_ITEM' },
                { tierPriority: 1 }  // Only include primary VIP items (not backups)
              ]
            }
          ]
        }
      },
      cardBreaks: {
        where: {
          status: 'AVAILABLE',
          OR: [
            { tierLevel: { not: 'VIP_ITEM' } },  // Include all non-VIP memorabilia
            {
              AND: [
                { tierLevel: 'VIP_ITEM' },
                { tierPriority: 1 }  // Only include primary VIP memorabilia (not backups)
              ]
            }
          ]
        }
      }
    }
  });

  if (!game) {
    throw new Error('Game not found');
  }

  // Generate the specified number of pools
  for (let i = 0; i < count; i++) {
    const pool = await generateSinglePool(game, bundleSize);

    if (pool) {
      // Store the pre-generated pool
      await prisma.prizePool.create({
        data: {
          id: `pp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          gameId,
          bundleSize,
          bundles: pool.bundles,
          totalValue: pool.totalValue,
          totalPrice: pool.totalPrice,
          status: PoolStatus.AVAILABLE
        }
      });
    }
  }
}

/**
 * Generate a single pool for a specific bundle size
 */
function generateSinglePool(game: any, quantity: number): any {
  // Build the inventory pool
  const inventoryPool: BundleItem[] = [];

  // Filter ticket levels by bundle quantity availability
  const eligibleTicketLevels = game.ticketLevels.filter((level: any) => {
    const availableUnits = level.availableUnits as number[] || [1, 2, 3, 4];
    return availableUnits.includes(quantity);
  });

  // Add eligible tickets to pool
  eligibleTicketLevels.forEach((level: any) => {
    for (let i = 0; i < level.quantity; i++) {
      inventoryPool.push({
        type: 'ticket',
        id: level.id,
        value: level.pricePerSeat,
        details: {
          level: level.level,
          levelName: level.levelName,
          sections: level.sections,
          viewImageUrl: level.viewImageUrl,
          tierLevel: level.tierLevel,
          tierPriority: level.tierPriority
        }
      });
    }
  });

  // Special prizes have been removed - using tier system instead

  // Add ticket groups
  if (game.ticketGroups) {
    const eligibleTicketGroups = game.ticketGroups.filter((group: any) => {
      if (group.availableUnits) {
        const availableUnits = group.availableUnits as number[];
        return availableUnits.includes(quantity);
      }
      return true;
    });

    eligibleTicketGroups.forEach((group: any) => {
      // Add each ticket in the group as individual items
      // This way they compete fairly with ticket levels
      const primaryImage = group.primaryImageIndex === 3 && group.seatViewUrl3 ? group.seatViewUrl3 :
                         group.primaryImageIndex === 2 && group.seatViewUrl2 ? group.seatViewUrl2 :
                         group.seatViewUrl;

      // Add one entry per ticket in the group
      for (let i = 0; i < group.quantity; i++) {
        inventoryPool.push({
          type: 'ticketGroup',
          id: group.id,
          value: group.pricePerSeat,
          details: {
            section: group.section,
            row: group.row,
            seatViewUrl: primaryImage,
            seatViewUrl2: group.seatViewUrl2,
            seatViewUrl3: group.seatViewUrl3,
            notes: group.notes,
            groupQuantity: group.quantity,
            isGroupedSeats: false, // No special treatment
            tierLevel: group.tierLevel,
            tierPriority: group.tierPriority
          }
        });
      }
    });
  }

  // Build memorabilia pool with tier filtering
  const memorabiliaPool: BundleItem[] = [];
  if (game.cardBreaks) {
    const eligibleMemorabilia = game.cardBreaks.filter((item: any) => {
      // Filter by available units
      const availableUnits = item.availableUnits as number[] || [1, 2, 3, 4];
      return availableUnits.includes(quantity);
    });

    eligibleMemorabilia.forEach((breakItem: any) => {
      // Add memorabilia items based on quantity
      for (let i = 0; i < breakItem.quantity; i++) {
        memorabiliaPool.push({
          type: 'memorabilia',
          id: breakItem.id,
          name: breakItem.breakName,
          value: breakItem.breakValue,
          details: {
            imageUrl: breakItem.imageUrl,
            description: breakItem.description,
            itemType: breakItem.itemType || 'memorabilia',
            tierLevel: breakItem.tierLevel,
            tierPriority: breakItem.tierPriority,
            availablePacks: breakItem.availablePacks
          }
        });
      }
    });
  }

  // Check if we have enough items
  const ticketCount = inventoryPool.filter(item =>
    item.type === 'ticket' || item.type === 'ticketGroup' || item.type === 'special'
  ).length;
  const memorabiliaCount = memorabiliaPool.length;

  if (ticketCount < quantity || memorabiliaCount < quantity) {
    console.log(`Not enough inventory for bundle size ${quantity}. Tickets: ${ticketCount}, Memorabilia: ${memorabiliaCount}`);
    return null;
  }

  // Log inventory distribution for debugging
  const ticketLevelCount = inventoryPool.filter(i => i.type === 'ticket').length;
  const ticketGroupCount = inventoryPool.filter(i => i.type === 'ticketGroup').length;
  const specialPrizeCount = inventoryPool.filter(i => i.type === 'special').length;

  // Get value distribution
  const values = inventoryPool.map(i => i.value).sort((a, b) => a - b);
  const minValue = values[0];
  const maxValue = values[values.length - 1];
  const medianValue = values[Math.floor(values.length / 2)];

  console.log(`[POOL] Inventory for bundle size ${quantity}:`, {
    ticketLevels: ticketLevelCount,
    ticketGroups: ticketGroupCount,
    specialPrizes: specialPrizeCount,
    total: ticketCount,
    valueRange: { min: minValue, max: maxValue, median: medianValue }
  });

  // Shuffle pools using Fisher-Yates algorithm for true randomness
  const shuffledTickets = fisherYatesShuffle([...inventoryPool]);
  const shuffledMemorabilia = fisherYatesShuffle([...memorabiliaPool]);

  // Create bundles - ensure same tickets for multi-quantity but unique memorabilia
  const bundles: GeneratedBundle[] = [];
  let totalValue = 0;

  if (quantity > 1) {
    // For multi-quantity, select ONE ticket type for adjacent seating
    // but DIFFERENT memorabilia items for variety
    const ticketItem = shuffledTickets.shift();

    if (ticketItem) {
      console.log(`[POOL] Multi-quantity bundle (${quantity}x) - Base ticket:`, {
        type: ticketItem.type,
        value: ticketItem.value,
        details: ticketItem.type === 'ticket' ? ticketItem.details.level : ticketItem.details.section
      });

      // Get unique memorabilia items for each bundle
      const selectedMemorabilia: string[] = [];
      for (let i = 0; i < quantity; i++) {
        const memorabiliaItem = shuffledMemorabilia.shift();
        if (memorabiliaItem) {
          bundles.push(createBundle(ticketItem, memorabiliaItem));
          totalValue += ticketItem.value + memorabiliaItem.value;
          selectedMemorabilia.push(memorabiliaItem.name || memorabiliaItem.id);
        }
      }

      console.log(`[POOL] Selected ${selectedMemorabilia.length} unique memorabilia items:`, selectedMemorabilia);
    }
  } else {
    // Single bundle - just take one of each
    const ticketItem = shuffledTickets.shift();
    const memorabiliaItem = shuffledMemorabilia.shift();

    if (ticketItem && memorabiliaItem) {
      bundles.push(createBundle(ticketItem, memorabiliaItem));
      totalValue += ticketItem.value + memorabiliaItem.value;
    }
  }

  // Calculate price with margin (includes tickets + memorabilia)
  const avgValue = totalValue / quantity; // Average per bundle
  const pricePerBundle = avgValue * 1.3; // 30% margin
  const totalPrice = pricePerBundle * quantity;

  // Log what was selected for debugging
  const selectedValues = bundles.map(b => b.ticket?.value || 0);
  console.log(`[POOL] Generated pool with values:`, selectedValues, `Total: ${totalValue}`);

  return {
    bundles,
    totalValue,
    totalPrice
  };
}

/**
 * Create a bundle from ticket and memorabilia items
 */
function createBundle(ticketItem: BundleItem, memorabiliaItem: BundleItem): GeneratedBundle {
  let ticket: any;
  let memorabilia: any;

  // Process ticket item
  if (ticketItem.type === 'ticket') {
    ticket = {
      level: ticketItem.details.level,
      levelName: ticketItem.details.levelName,
      value: ticketItem.value,
      sections: ticketItem.details.sections,
      viewImageUrl: ticketItem.details.viewImageUrl
    };
  } else if (ticketItem.type === 'ticketGroup') {
    ticket = {
      individual: true,
      section: ticketItem.details.section,
      row: ticketItem.details.row,
      value: ticketItem.value,
      seatViewUrl: ticketItem.details.seatViewUrl,
      seatViewUrl2: ticketItem.details.seatViewUrl2,
      seatViewUrl3: ticketItem.details.seatViewUrl3,
      notes: ticketItem.details.notes
    };
  } else if (ticketItem.type === 'special') {
    ticket = {
      special: true,
      prizeId: ticketItem.id, // Include the ID for backup activation
      name: ticketItem.name,
      description: ticketItem.details.description,
      value: ticketItem.value,
      prizeType: ticketItem.details.prizeType,
      imageUrl: ticketItem.details.imageUrl
    };
  }

  // Process memorabilia item
  memorabilia = {
    id: memorabiliaItem.id,
    name: memorabiliaItem.name,
    value: memorabiliaItem.value,
    description: memorabiliaItem.details.description,
    imageUrl: memorabiliaItem.details.imageUrl,
    itemType: memorabiliaItem.details.itemType,
    tierLevel: memorabiliaItem.details.tierLevel,
    tierPriority: memorabiliaItem.details.tierPriority,
    availablePacks: memorabiliaItem.details.availablePacks
  };

  return { ticket, memorabilia };
}

/**
 * Store the best possible prizes for display
 */
async function storeBestPrizes(gameId: string) {
  const game = await prisma.dailyGame.findUnique({
    where: { id: gameId },
    include: {
      ticketLevels: {
        orderBy: { pricePerSeat: 'desc' },
        take: 1
      },
      ticketGroups: {
        where: { status: 'AVAILABLE' },
        orderBy: { pricePerSeat: 'desc' },
        take: 1
      },
      specialPrizes: {
        orderBy: { value: 'desc' },
        take: 1
      },
      cardBreaks: {
        where: { status: 'AVAILABLE' },
        orderBy: { breakValue: 'desc' },
        take: 1
      }
    }
  });

  if (!game) return;

  // Find the best ticket (could be from levels, groups, or special prizes)
  let bestTicket: any = null;
  let bestTicketValue = 0;

  if (game.ticketLevels[0] && game.ticketLevels[0].pricePerSeat > bestTicketValue) {
    bestTicketValue = game.ticketLevels[0].pricePerSeat;
    bestTicket = {
      type: 'level',
      level: game.ticketLevels[0].level,
      levelName: game.ticketLevels[0].levelName,
      value: game.ticketLevels[0].pricePerSeat,
      viewImageUrl: game.ticketLevels[0].viewImageUrl
    };
  }

  if (game.ticketGroups[0] && game.ticketGroups[0].pricePerSeat > bestTicketValue) {
    bestTicketValue = game.ticketGroups[0].pricePerSeat;
    bestTicket = {
      type: 'individual',
      section: game.ticketGroups[0].section,
      row: game.ticketGroups[0].row,
      value: game.ticketGroups[0].pricePerSeat,
      seatViewUrl: game.ticketGroups[0].seatViewUrl
    };
  }

  if (game.specialPrizes[0] && game.specialPrizes[0].value > bestTicketValue) {
    bestTicketValue = game.specialPrizes[0].value;
    bestTicket = {
      type: 'special',
      name: game.specialPrizes[0].name,
      description: game.specialPrizes[0].description,
      value: game.specialPrizes[0].value,
      imageUrl: game.specialPrizes[0].imageUrl
    };
  }

  // Get best memorabilia
  const bestMemorabilia = game.cardBreaks[0] ? {
    id: game.cardBreaks[0].id,
    name: game.cardBreaks[0].breakName,
    value: game.cardBreaks[0].breakValue,
    imageUrl: game.cardBreaks[0].imageUrl,
    description: game.cardBreaks[0].description,
    tierLevel: game.cardBreaks[0].tierLevel,
    tierPriority: game.cardBreaks[0].tierPriority
  } : null;

  // Store or update best prizes
  await prisma.bestPrizes.upsert({
    where: { gameId },
    create: {
      id: `bp_${gameId}`,
      gameId,
      bestTicket: bestTicket || {},
      bestMemorabillia: bestMemorabilia || {},
      updatedAt: new Date()
    },
    update: {
      bestTicket: bestTicket || {},
      bestMemorabillia: bestMemorabilia || {},
      updatedAt: new Date()
    }
  });
}

/**
 * Get a random available pool for a game and bundle size
 */
export async function getRandomAvailablePool(gameId: string, bundleSize: number) {
  console.log(`[POOL] Looking for pool - gameId: ${gameId}, bundleSize: ${bundleSize}`);

  // Get all available pools for this game and bundle size
  const availablePools = await prisma.prizePool.findMany({
    where: {
      gameId,
      bundleSize,
      status: PoolStatus.AVAILABLE
    }
  });

  console.log(`[POOL] Found ${availablePools.length} available pools for game ${gameId} with bundle size ${bundleSize}`);

  if (availablePools.length === 0) {
    // Let's check what pools exist for this game
    const allPools = await prisma.prizePool.groupBy({
      by: ['bundleSize', 'status'],
      where: { gameId },
      _count: true
    });
    console.log(`[POOL] All pools for game ${gameId}:`, allPools);
    return null;
  }

  // Select a random pool
  const randomIndex = Math.floor(Math.random() * availablePools.length);
  return availablePools[randomIndex];
}

/**
 * Claim a pool and mark it as used
 */
export async function claimPool(poolId: string, userId: string) {
  return await prisma.prizePool.update({
    where: { id: poolId },
    data: {
      status: PoolStatus.CLAIMED,
      claimedAt: new Date(),
      claimedBy: userId
    }
  });
}

/**
 * Regenerate a single pool after one is claimed
 */
export async function regenerateSinglePool(gameId: string, bundleSize: number) {
  try {
    // Check how many available pools exist
    const availableCount = await prisma.prizePool.count({
      where: {
        gameId,
        bundleSize,
        status: PoolStatus.AVAILABLE
      }
    });

    console.log(`[POOL] Available pools for game ${gameId} size ${bundleSize}: ${availableCount}`);

    // If we have less than 5, generate one more
    if (availableCount < 5) {
      console.log(`[POOL] Regenerating pool for game ${gameId} size ${bundleSize}`);
      await generatePoolsForBundleSize(gameId, bundleSize, 1);
      console.log(`[POOL] Successfully regenerated pool for game ${gameId} size ${bundleSize}`);
    }
  } catch (error) {
    console.error(`[POOL] Error regenerating single pool for game ${gameId} size ${bundleSize}:`, error);
    // Don't throw - this runs in background, just log the error
  }
}

/**
 * Mark pools as stale when inventory changes
 */
export async function markPoolsAsStale(gameId: string) {
  await prisma.prizePool.updateMany({
    where: {
      gameId,
      status: PoolStatus.AVAILABLE
    },
    data: {
      status: PoolStatus.STALE
    }
  });

  // Regenerate fresh pools
  await generatePrizePools(gameId, 5);
}

/**
 * Check pool health and regenerate if needed
 * Returns true if pools are healthy, false if regeneration was needed
 */
export async function ensurePoolsAvailable(gameId: string, bundleSize: number): Promise<boolean> {
  try {
    const availableCount = await prisma.prizePool.count({
      where: {
        gameId,
        bundleSize,
        status: PoolStatus.AVAILABLE
      }
    });

    console.log(`[POOL HEALTH] Game ${gameId} size ${bundleSize}: ${availableCount} available pools`);

    if (availableCount === 0) {
      console.log(`[POOL HEALTH] CRITICAL: No pools available for game ${gameId} size ${bundleSize}. Regenerating...`);

      // Try to generate emergency pools
      try {
        await generatePoolsForBundleSize(gameId, bundleSize, 5);
        console.log(`[POOL HEALTH] Successfully regenerated pools for game ${gameId} size ${bundleSize}`);
      } catch (error) {
        console.error(`[POOL HEALTH] Failed to regenerate pools for game ${gameId} size ${bundleSize}:`, error);
        return false;
      }
    } else if (availableCount < 3) {
      console.log(`[POOL HEALTH] WARNING: Low pool count (${availableCount}) for game ${gameId} size ${bundleSize}. Regenerating...`);

      // Generate more pools in background
      generatePoolsForBundleSize(gameId, bundleSize, 5 - availableCount).catch(error => {
        console.error(`[POOL HEALTH] Background regeneration failed for game ${gameId} size ${bundleSize}:`, error);
      });
    }

    return availableCount > 0;
  } catch (error) {
    console.error(`[POOL HEALTH] Error checking pool health for game ${gameId} size ${bundleSize}:`, error);
    return false;
  }
}