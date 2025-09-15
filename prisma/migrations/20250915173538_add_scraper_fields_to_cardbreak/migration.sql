-- AlterTable
ALTER TABLE "public"."CardBreak" ADD COLUMN     "breakType" TEXT,
ADD COLUMN     "scrapedAt" TIMESTAMP(3),
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "spotPrice" DOUBLE PRECISION,
ADD COLUMN     "teamName" TEXT;
