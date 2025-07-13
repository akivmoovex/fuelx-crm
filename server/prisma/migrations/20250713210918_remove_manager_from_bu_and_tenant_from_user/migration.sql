/*
  Warnings:

  - You are about to drop the column `managerId` on the `business_units` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "business_units" DROP CONSTRAINT "business_units_managerId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_tenantId_fkey";

-- AlterTable
ALTER TABLE "business_units" DROP COLUMN "managerId";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "tenantId";
