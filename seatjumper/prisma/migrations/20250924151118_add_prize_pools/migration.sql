-- CreateEnum
CREATE TYPE "public"."PoolStatus" AS ENUM ('AVAILABLE', 'CLAIMED', 'STALE');

-- CreateTable
CREATE TABLE "public"."PrizePool" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "bundleSize" INTEGER NOT NULL,
    "bundles" JSONB NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "status" "public"."PoolStatus" NOT NULL DEFAULT 'AVAILABLE',
    "claimedAt" TIMESTAMP(3),
    "claimedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrizePool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BestPrizes" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "bestTicket" JSONB NOT NULL,
    "bestMemorabillia" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BestPrizes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrizePool_gameId_bundleSize_status_idx" ON "public"."PrizePool"("gameId", "bundleSize", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BestPrizes_gameId_key" ON "public"."BestPrizes"("gameId");

-- AddForeignKey
ALTER TABLE "public"."PrizePool" ADD CONSTRAINT "PrizePool_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."DailyGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BestPrizes" ADD CONSTRAINT "BestPrizes_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."DailyGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
