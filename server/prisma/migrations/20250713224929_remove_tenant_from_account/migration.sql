/*
  Warnings:

  - You are about to drop the column `tenantId` on the `accounts` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_tenantId_fkey";

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "tenantId";
