-- Every funko has a series (issue #40). There is no made-up "Unknown" series to fill the gaps: a database with a
-- funko that has none stops here, saying how many, and is reseeded (there is no real data yet).
DO $$
DECLARE
  funkos_without_series integer;
BEGIN
  SELECT count(*) INTO funkos_without_series FROM "funkos" WHERE "series_id" IS NULL;

  IF funkos_without_series > 0 THEN
    RAISE EXCEPTION '% funko(s) have no series. Every funko needs one now: give each a series, or reseed this database, then migrate again.', funkos_without_series;
  END IF;
END $$;

-- DropForeignKey
ALTER TABLE "funkos" DROP CONSTRAINT "funkos_series_id_fkey";

-- AlterTable
ALTER TABLE "funkos" ALTER COLUMN "series_id" SET NOT NULL;

-- A series a funko uses can no longer be deleted (it used to clear the funko's series). The api answers 409 in words.
-- AddForeignKey
ALTER TABLE "funkos" ADD CONSTRAINT "funkos_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
