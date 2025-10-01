import { prisma } from '@/lib/db';

/**
 * Activates a backup prize when a special prize is won
 * This ensures there's always a big prize available
 */
export async function activateBackupPrize(mainPrizeId: string) {
  try {
    // First, decrement the quantity of the main prize
    const mainPrize = await prisma.specialPrize.findUnique({
      where: { id: mainPrizeId }
    });

    if (!mainPrize) {
      console.log(`[BACKUP] Main prize ${mainPrizeId} not found`);
      return;
    }

    // Update the main prize quantity
    const updatedMainPrize = await prisma.specialPrize.update({
      where: { id: mainPrizeId },
      data: {
        quantity: Math.max(0, mainPrize.quantity - 1)
      }
    });

    console.log(`[BACKUP] Main prize ${mainPrize.name} quantity reduced to ${updatedMainPrize.quantity}`);

    // If main prize is depleted, activate its backup
    if (updatedMainPrize.quantity === 0) {
      // Find the backup prize for this main prize
      const backupPrize = await prisma.specialPrize.findFirst({
        where: {
          backupFor: mainPrizeId,
          isBackup: true,
          quantity: { gt: 0 }
        }
      });

      if (backupPrize) {
        console.log(`[BACKUP] Activating backup prize: ${backupPrize.name} for depleted ${mainPrize.name}`);

        // "Promote" the backup to be a regular prize
        await prisma.specialPrize.update({
          where: { id: backupPrize.id },
          data: {
            isBackup: false,
            backupFor: null
          }
        });

        console.log(`[BACKUP] Backup prize ${backupPrize.name} is now active as main prize`);
      } else {
        console.log(`[BACKUP] No backup available for ${mainPrize.name}`);
      }
    }
  } catch (error) {
    console.error('[BACKUP] Error activating backup prize:', error);
  }
}

/**
 * Checks if any special prizes need their backups activated
 * Can be called periodically or after pool generation
 */
export async function checkAndActivateBackups(gameId: string) {
  try {
    // Find all depleted main prizes that have backups
    const depletedPrizes = await prisma.specialPrize.findMany({
      where: {
        gameId,
        quantity: 0,
        isBackup: false
      }
    });

    for (const depleted of depletedPrizes) {
      // Check if this prize has a backup available
      const backup = await prisma.specialPrize.findFirst({
        where: {
          gameId,
          backupFor: depleted.id,
          isBackup: true,
          quantity: { gt: 0 }
        }
      });

      if (backup) {
        console.log(`[BACKUP] Auto-activating backup ${backup.name} for depleted ${depleted.name}`);

        // Promote the backup
        await prisma.specialPrize.update({
          where: { id: backup.id },
          data: {
            isBackup: false,
            backupFor: null
          }
        });
      }
    }
  } catch (error) {
    console.error('[BACKUP] Error checking backups:', error);
  }
}