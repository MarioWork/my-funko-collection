-- Submissions (docs/adr/0001-shared-catalogue-own-collections.md): a member's new funko, category or series waits
-- for an admin, seen only by its sender; an admin's joins the catalogue at once. Everything already there is
-- APPROVED, with no sender.
CREATE TYPE "submission_status" AS ENUM ('WAITING', 'APPROVED', 'REJECTED', 'MERGED');

ALTER TABLE "categories" ADD COLUMN     "status" "submission_status" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "submitted_by_id" INTEGER;

ALTER TABLE "funkos" ADD COLUMN     "status" "submission_status" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "submitted_by_id" INTEGER;

ALTER TABLE "series" ADD COLUMN     "status" "submission_status" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "submitted_by_id" INTEGER;

CREATE INDEX "categories_submitted_by_id_idx" ON "categories"("submitted_by_id");

CREATE INDEX "funkos_submitted_by_id_idx" ON "funkos"("submitted_by_id");

CREATE INDEX "series_submitted_by_id_idx" ON "series"("submitted_by_id");

ALTER TABLE "categories" ADD CONSTRAINT "categories_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "series" ADD CONSTRAINT "series_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "funkos" ADD CONSTRAINT "funkos_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A submission always has its sender: only an approved funko may have none (an admin's, or one whose sender was
-- deleted after approval). Kept by hand (Prisma ignores checks).
ALTER TABLE "funkos" ADD CONSTRAINT "funkos_submitter_chk"
  CHECK ("status" = 'APPROVED' OR "submitted_by_id" IS NOT NULL);

-- The unique rules hold in the approved catalogue, and within one member's waiting submissions, never across them:
-- two members may each send in the same box, and an admin may add one a member is waiting on (a merge sorts it out
-- later). Same names as the full indexes they replace. Kept by hand (Prisma ignores partial indexes).
DROP INDEX "categories_name_uidx";
DROP INDEX "series_name_uidx";
DROP INDEX "funkos_barcode_uidx";
DROP INDEX "funkos_identity_uidx";

CREATE UNIQUE INDEX "categories_name_uidx" ON "categories"("name") WHERE "status" = 'APPROVED';
CREATE UNIQUE INDEX "categories_submitter_name_uidx" ON "categories"("submitted_by_id", "name")
  WHERE "status" = 'WAITING';

CREATE UNIQUE INDEX "series_name_uidx" ON "series"("name") WHERE "status" = 'APPROVED';
CREATE UNIQUE INDEX "series_submitter_name_uidx" ON "series"("submitted_by_id", "name") WHERE "status" = 'WAITING';

CREATE UNIQUE INDEX "funkos_barcode_uidx" ON "funkos"("barcode") WHERE "status" = 'APPROVED';
CREATE UNIQUE INDEX "funkos_submitter_barcode_uidx" ON "funkos"("submitted_by_id", "barcode")
  WHERE "status" = 'WAITING';

CREATE UNIQUE INDEX "funkos_identity_uidx" ON "funkos"("category_id", "number", "name", "is_chase", "exclusive")
  WHERE "status" = 'APPROVED';
CREATE UNIQUE INDEX "funkos_submitter_identity_uidx"
  ON "funkos"("submitted_by_id", "category_id", "number", "name", "is_chase", "exclusive")
  WHERE "status" = 'WAITING';

-- Lookups by barcode (scanner, duplicate guard) also look at waiting submissions now, which the partial index skips.
CREATE INDEX "funkos_barcode_idx" ON "funkos"("barcode");

-- Deleting a user deletes what they sent in that never joined the catalogue (waiting, rejected or merged: nobody
-- else sees it), whichever code deletes the user. Their items of those funkos go first (the item → funko key
-- refuses), the images with the funko rows (their files stay until `yarn images:prune`). The categories and series
-- they typed in go too, unless a funko still uses one. Approved ones stay; the foreign keys clear their sender.
-- Kept by hand (Prisma does not know triggers).
CREATE FUNCTION "remove_unapproved_submissions"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM "collection_items"
  WHERE "funko_id" IN (
    SELECT "id" FROM "funkos" WHERE "submitted_by_id" = OLD."id" AND "status" <> 'APPROVED'
  );

  DELETE FROM "funkos" WHERE "submitted_by_id" = OLD."id" AND "status" <> 'APPROVED';

  DELETE FROM "categories" c
  WHERE c."submitted_by_id" = OLD."id"
    AND c."status" <> 'APPROVED'
    AND NOT EXISTS (SELECT 1 FROM "funkos" f WHERE f."category_id" = c."id");

  DELETE FROM "series" s
  WHERE s."submitted_by_id" = OLD."id"
    AND s."status" <> 'APPROVED'
    AND NOT EXISTS (SELECT 1 FROM "funkos" f WHERE f."series_id" = s."id");

  RETURN OLD;
END;
$$;

CREATE TRIGGER "users_remove_unapproved_submissions_trg"
BEFORE DELETE ON "users"
FOR EACH ROW EXECUTE FUNCTION "remove_unapproved_submissions"();
