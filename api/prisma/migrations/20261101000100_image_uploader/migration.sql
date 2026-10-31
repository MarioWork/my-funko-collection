-- Every image records who uploaded it (its created_at is when). Deleting that user keeps the image and clears the
-- column: the Images page shows a removed user.

-- AlterTable
ALTER TABLE "funko_images" ADD COLUMN     "uploaded_by_id" INTEGER;

-- The images here today were all uploaded by whoever set the app up: they go to the current admin (the first one,
-- if there are several). With no admin yet, they stay without an uploader.
UPDATE "funko_images" SET "uploaded_by_id" = (SELECT min("id") FROM "users" WHERE "role" = 'ADMIN');

-- CreateIndex
CREATE INDEX "funko_images_uploaded_by_id_idx" ON "funko_images"("uploaded_by_id");

-- AddForeignKey
ALTER TABLE "funko_images" ADD CONSTRAINT "funko_images_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
