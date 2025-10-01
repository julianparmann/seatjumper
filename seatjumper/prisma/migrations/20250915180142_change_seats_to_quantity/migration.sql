/*
  Warnings:

  - You are about to drop the column `seats` on the `TicketGroup` table. All the data in the column will be lost.
  - Added the required column `quantity` to the `TicketGroup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."TicketGroup" DROP COLUMN "seats",
ADD COLUMN     "quantity" INTEGER NOT NULL;
