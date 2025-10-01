-- AlterTable
ALTER TABLE "public"."CardBreak" ADD COLUMN     "category" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "itemType" TEXT DEFAULT 'break';
