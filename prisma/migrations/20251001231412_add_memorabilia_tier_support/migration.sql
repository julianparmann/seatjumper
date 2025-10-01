-- AlterTable
ALTER TABLE "public"."CardBreak" ADD COLUMN     "availablePacks" JSONB NOT NULL DEFAULT '["blue", "red", "gold"]',
ADD COLUMN     "availableUnits" JSONB NOT NULL DEFAULT '[1, 2, 3, 4]',
ADD COLUMN     "tierLevel" "public"."TierLevel",
ADD COLUMN     "tierPriority" INTEGER,
ALTER COLUMN "itemType" SET DEFAULT 'memorabilia';
