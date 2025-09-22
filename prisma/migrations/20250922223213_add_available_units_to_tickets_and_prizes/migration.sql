-- AlterTable
ALTER TABLE "public"."SpecialPrize" ADD COLUMN     "availableUnits" JSONB NOT NULL DEFAULT '[1, 2, 3, 4]';

-- AlterTable
ALTER TABLE "public"."TicketLevel" ADD COLUMN     "availableUnits" JSONB NOT NULL DEFAULT '[1, 2, 3, 4]';
