/*
  Warnings:

  - You are about to drop the column `cardPackImageUrl` on the `DailyGame` table. All the data in the column will be lost.
  - You are about to drop the column `cardPackName` on the `DailyGame` table. All the data in the column will be lost.
  - You are about to drop the column `cardPackValue` on the `DailyGame` table. All the data in the column will be lost.
  - You are about to drop the column `entryPrice` on the `DailyGame` table. All the data in the column will be lost.
  - You are about to drop the column `totalValue` on the `DailyGame` table. All the data in the column will be lost.
  - You are about to drop the column `winnerId` on the `DailyGame` table. All the data in the column will be lost.
  - You are about to drop the `ManualTicket` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('AVAILABLE', 'SOLD', 'RESERVED');

-- CreateEnum
CREATE TYPE "public"."BreakStatus" AS ENUM ('AVAILABLE', 'SOLD', 'RESERVED');

-- DropForeignKey
ALTER TABLE "public"."DailyGame" DROP CONSTRAINT "DailyGame_winnerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ManualTicket" DROP CONSTRAINT "ManualTicket_gameId_fkey";

-- AlterTable
ALTER TABLE "public"."DailyGame" DROP COLUMN "cardPackImageUrl",
DROP COLUMN "cardPackName",
DROP COLUMN "cardPackValue",
DROP COLUMN "entryPrice",
DROP COLUMN "totalValue",
DROP COLUMN "winnerId",
ADD COLUMN     "avgBreakValue" DOUBLE PRECISION,
ADD COLUMN     "avgTicketPrice" DOUBLE PRECISION,
ADD COLUMN     "spinPricePerBundle" DOUBLE PRECISION;

-- DropTable
DROP TABLE "public"."ManualTicket";

-- CreateTable
CREATE TABLE "public"."TicketGroup" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "row" TEXT NOT NULL,
    "seats" JSONB NOT NULL,
    "pricePerSeat" DOUBLE PRECISION NOT NULL,
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'AVAILABLE',
    "ticketType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CardBreak" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "breakName" TEXT NOT NULL,
    "breakValue" DOUBLE PRECISION NOT NULL,
    "breakDateTime" TIMESTAMP(3) NOT NULL,
    "streamUrl" TEXT,
    "breaker" TEXT NOT NULL,
    "status" "public"."BreakStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardBreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SpinResult" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bundleSize" INTEGER NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "ticketGroupId" TEXT NOT NULL,
    "paymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpinResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SpinResultBreak" (
    "id" TEXT NOT NULL,
    "spinResultId" TEXT NOT NULL,
    "cardBreakId" TEXT NOT NULL,

    CONSTRAINT "SpinResultBreak_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpinResult_ticketGroupId_key" ON "public"."SpinResult"("ticketGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "SpinResultBreak_spinResultId_cardBreakId_key" ON "public"."SpinResultBreak"("spinResultId", "cardBreakId");

-- AddForeignKey
ALTER TABLE "public"."TicketGroup" ADD CONSTRAINT "TicketGroup_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."DailyGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CardBreak" ADD CONSTRAINT "CardBreak_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."DailyGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SpinResult" ADD CONSTRAINT "SpinResult_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."DailyGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SpinResult" ADD CONSTRAINT "SpinResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SpinResult" ADD CONSTRAINT "SpinResult_ticketGroupId_fkey" FOREIGN KEY ("ticketGroupId") REFERENCES "public"."TicketGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SpinResultBreak" ADD CONSTRAINT "SpinResultBreak_spinResultId_fkey" FOREIGN KEY ("spinResultId") REFERENCES "public"."SpinResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SpinResultBreak" ADD CONSTRAINT "SpinResultBreak_cardBreakId_fkey" FOREIGN KEY ("cardBreakId") REFERENCES "public"."CardBreak"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
