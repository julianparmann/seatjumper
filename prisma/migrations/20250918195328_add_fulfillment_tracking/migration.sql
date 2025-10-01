-- AlterTable
ALTER TABLE "public"."SpinResult" ADD COLUMN     "memorabiliaShipped" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "memorabiliaShippedAt" TIMESTAMP(3),
ADD COLUMN     "shippingCarrier" TEXT,
ADD COLUMN     "ticketsTransferred" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ticketsTransferredAt" TIMESTAMP(3),
ADD COLUMN     "trackingNumber" TEXT;
