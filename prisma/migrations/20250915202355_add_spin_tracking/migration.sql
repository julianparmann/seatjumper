/*
  Warnings:

  - You are about to drop the column `bundleSize` on the `SpinResult` table. All the data in the column will be lost.
  - You are about to drop the column `ticketGroupId` on the `SpinResult` table. All the data in the column will be lost.
  - You are about to drop the `SpinResultBreak` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `quantity` to the `SpinResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalValue` to the `SpinResult` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."SpinResult" DROP CONSTRAINT "SpinResult_ticketGroupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SpinResultBreak" DROP CONSTRAINT "SpinResultBreak_cardBreakId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SpinResultBreak" DROP CONSTRAINT "SpinResultBreak_spinResultId_fkey";

-- DropIndex
DROP INDEX "public"."SpinResult_ticketGroupId_key";

-- AlterTable
ALTER TABLE "public"."SpinResult" DROP COLUMN "bundleSize",
DROP COLUMN "ticketGroupId",
ADD COLUMN     "adjacentSeats" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "totalValue" DOUBLE PRECISION NOT NULL;

-- DropTable
DROP TABLE "public"."SpinResultBreak";

-- CreateTable
CREATE TABLE "public"."SpinBundle" (
    "id" TEXT NOT NULL,
    "spinResultId" TEXT NOT NULL,
    "ticketSection" TEXT NOT NULL,
    "ticketRow" TEXT NOT NULL,
    "ticketValue" DOUBLE PRECISION NOT NULL,
    "ticketQuantity" INTEGER NOT NULL DEFAULT 1,
    "breaks" JSONB NOT NULL,
    "bundleValue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SpinBundle_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."SpinBundle" ADD CONSTRAINT "SpinBundle_spinResultId_fkey" FOREIGN KEY ("spinResultId") REFERENCES "public"."SpinResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
