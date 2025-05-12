/*
  Warnings:

  - You are about to drop the column `bertScore` on the `Run` table. All the data in the column will be lost.
  - You are about to drop the column `semantic` on the `Run` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Run" DROP COLUMN "bertScore",
DROP COLUMN "semantic",
ADD COLUMN     "metrics" JSONB;
