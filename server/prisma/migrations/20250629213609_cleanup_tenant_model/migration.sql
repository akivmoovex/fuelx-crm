/*
  Warnings:

  - The values [ACCOUNT,CUSTOMER] on the enum `TenantType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdAt` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `tenants` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TenantType_new" AS ENUM ('HQ', 'SALES_OFFICE');
ALTER TABLE "tenants" ALTER COLUMN "type" TYPE "TenantType_new" USING ("type"::text::"TenantType_new");
ALTER TYPE "TenantType" RENAME TO "TenantType_old";
ALTER TYPE "TenantType_new" RENAME TO "TenantType";
DROP TYPE "TenantType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "tenants" DROP CONSTRAINT "tenants_parentId_fkey";

-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "createdAt",
DROP COLUMN "notes",
DROP COLUMN "parentId",
DROP COLUMN "updatedAt",
ADD COLUMN     "description" TEXT;
