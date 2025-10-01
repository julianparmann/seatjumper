-- AlterTable
ALTER TABLE "public"."TicketLevel" ADD COLUMN     "availablePacks" JSONB DEFAULT '["blue", "red", "gold"]';
