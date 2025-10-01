-- CreateEnum
CREATE TYPE "public"."GameStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SOLD_OUT', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."DailyGame" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "venue" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "sport" "public"."Sport" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "maxEntries" INTEGER NOT NULL DEFAULT 100,
    "currentEntries" INTEGER NOT NULL DEFAULT 0,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "cardPackName" TEXT NOT NULL,
    "cardPackValue" DOUBLE PRECISION NOT NULL,
    "cardPackImageUrl" TEXT,
    "status" "public"."GameStatus" NOT NULL DEFAULT 'DRAFT',
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ManualTicket" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "row" TEXT NOT NULL,
    "seatNumbers" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "purchaseCost" DOUBLE PRECISION NOT NULL,
    "marketValue" DOUBLE PRECISION NOT NULL,
    "ticketType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GameEntry" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryNumber" INTEGER NOT NULL,
    "paymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameEntry_gameId_entryNumber_key" ON "public"."GameEntry"("gameId", "entryNumber");

-- AddForeignKey
ALTER TABLE "public"."DailyGame" ADD CONSTRAINT "DailyGame_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ManualTicket" ADD CONSTRAINT "ManualTicket_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."DailyGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameEntry" ADD CONSTRAINT "GameEntry_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."DailyGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameEntry" ADD CONSTRAINT "GameEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
