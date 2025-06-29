/*
  Warnings:

  - You are about to drop the column `email` on the `business_units` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `business_units` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `business_units` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "business_units" DROP COLUMN "email",
DROP COLUMN "location",
DROP COLUMN "phone",
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "country" SET DEFAULT 'Zambia';
