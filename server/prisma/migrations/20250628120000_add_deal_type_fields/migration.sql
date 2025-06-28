-- AlterTable
ALTER TABLE "Deal" ADD COLUMN "dealType" TEXT NOT NULL DEFAULT 'fuel';
ALTER TABLE "Deal" ADD COLUMN "litresPerMonth" INTEGER;
ALTER TABLE "Deal" ADD COLUMN "insuranceType" TEXT; 