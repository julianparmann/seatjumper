import { prisma } from '@/lib/db';

/**
 * Activates the next priority VIP item when main VIP items are depleted
 * This ensures there's always a VIP-tier prize available
 */
export async function promoteVipBackup(gameId: string, depletedLevelId: string) {
  try {
    // Get the depleted level to check its priority
    const depletedLevel = await prisma.ticketLevel.findUnique({
      where: { id: depletedLevelId }
    });

    if (!depletedLevel || depletedLevel.tierLevel !== 'VIP_ITEM') {
      return; // Only handle VIP items
    }

    console.log(`[VIP-TIER] VIP item ${depletedLevel.levelName} depleted (priority ${depletedLevel.tierPriority})`);

    // Find the next priority VIP item to promote
    const nextVipItem = await prisma.ticketLevel.findFirst({
      where: {
        gameId,
        tierLevel: 'VIP_ITEM',
        tierPriority: { gt: depletedLevel.tierPriority || 1 },
        quantity: { gt: 0 }
      },
      orderBy: { tierPriority: 'asc' }
    });

    if (nextVipItem) {
      // Promote the backup to primary priority
      await prisma.ticketLevel.update({
        where: { id: nextVipItem.id },
        data: { tierPriority: 1 }
      });

      console.log(`[VIP-TIER] Promoted ${nextVipItem.levelName} to primary VIP (was priority ${nextVipItem.tierPriority})`);
    } else {
      // Also check ticket groups for VIP backups
      const nextVipGroup = await prisma.ticketGroup.findFirst({
        where: {
          gameId,
          tierLevel: 'VIP_ITEM',
          tierPriority: { gt: depletedLevel.tierPriority || 1 },
          status: 'AVAILABLE'
        },
        orderBy: { tierPriority: 'asc' }
      });

      if (nextVipGroup) {
        await prisma.ticketGroup.update({
          where: { id: nextVipGroup.id },
          data: { tierPriority: 1 }
        });

        console.log(`[VIP-TIER] Promoted ticket group ${nextVipGroup.section} ${nextVipGroup.row} to primary VIP`);
      } else {
        console.log(`[VIP-TIER] No VIP backups available for game ${gameId}`);
      }
    }
  } catch (error) {
    console.error('[VIP-TIER] Error promoting VIP backup:', error);
  }
}

/**
 * Checks and promotes VIP backups for a game
 * Can be called after pool generation or inventory updates
 */
export async function checkAndPromoteVipBackups(gameId: string) {
  try {
    // Find all depleted primary VIP items
    const depletedPrimaryVips = await prisma.ticketLevel.findMany({
      where: {
        gameId,
        tierLevel: 'VIP_ITEM',
        tierPriority: 1,
        quantity: 0
      }
    });

    for (const depleted of depletedPrimaryVips) {
      await promoteVipBackup(gameId, depleted.id);
    }

    // Also check ticket groups
    const soldOutVipGroups = await prisma.ticketGroup.findMany({
      where: {
        gameId,
        tierLevel: 'VIP_ITEM',
        tierPriority: 1,
        status: { not: 'AVAILABLE' }
      }
    });

    for (const group of soldOutVipGroups) {
      // Find next priority backup
      const backup = await prisma.ticketGroup.findFirst({
        where: {
          gameId,
          tierLevel: 'VIP_ITEM',
          tierPriority: { gt: 1 },
          status: 'AVAILABLE'
        },
        orderBy: { tierPriority: 'asc' }
      });

      if (backup) {
        await prisma.ticketGroup.update({
          where: { id: backup.id },
          data: { tierPriority: 1 }
        });
        console.log(`[VIP-TIER] Auto-promoted backup ticket group ${backup.section} to primary`);
      }
    }
  } catch (error) {
    console.error('[VIP-TIER] Error checking VIP backups:', error);
  }
}

/**
 * Updates inventory quantities after a VIP item is won
 */
export async function decrementVipInventory(itemId: string, isTicketLevel: boolean) {
  try {
    if (isTicketLevel) {
      const level = await prisma.ticketLevel.findUnique({
        where: { id: itemId }
      });

      if (!level) return;

      const updated = await prisma.ticketLevel.update({
        where: { id: itemId },
        data: {
          quantity: Math.max(0, level.quantity - 1)
        }
      });

      console.log(`[VIP-TIER] Decremented ${level.levelName} quantity to ${updated.quantity}`);

      // Check if we need to promote a backup
      if (updated.quantity === 0 && updated.tierLevel === 'VIP_ITEM' && updated.tierPriority === 1) {
        await promoteVipBackup(level.gameId, level.id);
      }
    } else {
      // Handle ticket group
      const group = await prisma.ticketGroup.findUnique({
        where: { id: itemId }
      });

      if (!group) return;

      const updated = await prisma.ticketGroup.update({
        where: { id: itemId },
        data: {
          quantity: Math.max(0, group.quantity - 1),
          status: group.quantity <= 1 ? 'SOLD' : 'AVAILABLE'
        }
      });

      console.log(`[VIP-TIER] Decremented ticket group quantity to ${updated.quantity}`);

      // Check if we need to promote a backup
      if (updated.status === 'SOLD' && updated.tierLevel === 'VIP_ITEM' && updated.tierPriority === 1) {
        await checkAndPromoteVipBackups(group.gameId);
      }
    }
  } catch (error) {
    console.error('[VIP-TIER] Error decrementing inventory:', error);
  }
}