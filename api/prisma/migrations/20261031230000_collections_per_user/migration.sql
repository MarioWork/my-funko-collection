-- Collections, and the items in them, belong to one user (docs/adr/0001-shared-catalogue-own-collections.md).

-- AlterTable: nullable first, so the rows already here can be given their owner.
ALTER TABLE "collections" ADD COLUMN "user_id" INTEGER;

-- Every collection that exists today becomes the current user's: the first user, the only one so far.
UPDATE "collections" SET "user_id" = (SELECT min("id") FROM "users");

-- Nobody set up yet means no owner. Then only the empty "Owned" and "Wishlist" of the default_collections migration
-- can be here (every route and the seed need a user). They go; the trigger below makes them again for each user.
DELETE FROM "collections" WHERE "user_id" IS NULL;

ALTER TABLE "collections" ALTER COLUMN "user_id" SET NOT NULL;

-- Names are unique per user, not across the app: two users may each have a "Wishlist".
DROP INDEX "collections_name_uidx";

CREATE UNIQUE INDEX "collections_user_id_name_uidx" ON "collections"("user_id", "name");

-- AddForeignKey: deleting a user deletes their collections, and with them their items.
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One default collection per user, not one in the whole app. Kept by hand (Prisma ignores partial indexes).
DROP INDEX "collections_is_default_uidx";

CREATE UNIQUE INDEX "collections_user_id_is_default_uidx" ON "collections"("user_id") WHERE "is_default";

-- Every user has "Owned" (the default) and "Wishlist" from the moment they exist, whichever code makes the user:
-- the first setup, the seed, the tests, later the admin's Users page. Kept by hand (Prisma does not know triggers).
CREATE FUNCTION "add_default_collections"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "collections" ("user_id", "name", "notes", "is_default")
  VALUES
    (NEW."id", 'Owned', 'Everything on the shelves and in the boxes', true),
    (NEW."id", 'Wishlist', 'Next buys', false);

  RETURN NEW;
END;
$$;

CREATE TRIGGER "users_add_default_collections_trg"
AFTER INSERT ON "users"
FOR EACH ROW EXECUTE FUNCTION "add_default_collections"();
