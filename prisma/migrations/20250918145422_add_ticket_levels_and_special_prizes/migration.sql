-- CreateTable
CREATE TABLE "public"."TicketLevel" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "levelName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricePerSeat" DOUBLE PRECISION NOT NULL,
    "viewImageUrl" TEXT,
    "sections" TEXT[],
    "isSelectable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SpecialPrize" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "prizeType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecialPrize_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."TicketLevel" ADD CONSTRAINT "TicketLevel_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."DailyGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SpecialPrize" ADD CONSTRAINT "SpecialPrize_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."DailyGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
