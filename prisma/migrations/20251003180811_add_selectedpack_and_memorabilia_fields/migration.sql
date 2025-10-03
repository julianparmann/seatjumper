-- AlterTable
ALTER TABLE "public"."SpinBundle" ADD COLUMN     "memorabiliaImageUrl" TEXT,
ADD COLUMN     "memorabiliaName" TEXT,
ADD COLUMN     "memorabiliaValue" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."SpinResult" ADD COLUMN     "selectedPack" TEXT;
