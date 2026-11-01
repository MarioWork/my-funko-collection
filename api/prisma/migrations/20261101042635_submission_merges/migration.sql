-- Admins merge a submission into a funko already in the catalogue (docs/GLOSSARY.md "Merge"): the submission
-- remembers which one, and its sender is told.

-- AlterEnum
ALTER TYPE "notification_kind" ADD VALUE 'SUBMISSION_MERGED';

-- AlterTable
ALTER TABLE "funkos" ADD COLUMN     "merged_into_id" INTEGER;

-- CreateIndex
CREATE INDEX "funkos_merged_into_id_idx" ON "funkos"("merged_into_id");

-- AddForeignKey
ALTER TABLE "funkos" ADD CONSTRAINT "funkos_merged_into_id_fkey" FOREIGN KEY ("merged_into_id") REFERENCES "funkos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Only a merged submission points at another funko. Kept by hand (Prisma ignores checks). A merged one may lose its
-- target (that funko deleted later: ON DELETE SET NULL) and still reads as merged.
ALTER TABLE "funkos" ADD CONSTRAINT "funkos_merged_into_id_check"
  CHECK ("merged_into_id" IS NULL OR "status" = 'MERGED');
