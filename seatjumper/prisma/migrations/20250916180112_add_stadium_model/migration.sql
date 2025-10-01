-- AlterTable
ALTER TABLE "public"."DailyGame" ADD COLUMN     "stadiumId" TEXT;

-- CreateTable
CREATE TABLE "public"."Stadium" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "imageWidth" INTEGER NOT NULL,
    "imageHeight" INTEGER NOT NULL,
    "sectionConfig" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stadium_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stadium_name_key" ON "public"."Stadium"("name");

-- AddForeignKey
ALTER TABLE "public"."DailyGame" ADD CONSTRAINT "DailyGame_stadiumId_fkey" FOREIGN KEY ("stadiumId") REFERENCES "public"."Stadium"("id") ON DELETE SET NULL ON UPDATE CASCADE;
