-- CreateEnum
CREATE TYPE "public"."TierLevel" AS ENUM ('VIP_ITEM', 'GOLD_LEVEL', 'UPPER_DECK');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PaymentStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'REQUIRES_FULFILLMENT';

-- AlterTable
ALTER TABLE "public"."SpecialPrize" ADD COLUMN     "backupFor" TEXT,
ADD COLUMN     "isBackup" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."SpinResult" ADD COLUMN     "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "stripeSessionId" TEXT;

-- AlterTable
ALTER TABLE "public"."TicketGroup" ADD COLUMN     "availablePacks" JSONB,
ADD COLUMN     "primaryImageIndex" INTEGER DEFAULT 1,
ADD COLUMN     "seatViewUrl3" TEXT,
ADD COLUMN     "tierLevel" "public"."TierLevel",
ADD COLUMN     "tierPriority" INTEGER;

-- AlterTable
ALTER TABLE "public"."TicketLevel" ADD COLUMN     "tierLevel" "public"."TierLevel",
ADD COLUMN     "tierPriority" INTEGER;
