-- Collections, and the items in them, belong to one user (docs/adr/0001-shared-catalogue-own-collections.md).

-- AlterTable: nullable first, so the rows already here can be given their user.
ALTER TABLE "collections" ADD COLUMN "user_id" INTEGER;

-- Collections with no user to own them: a fresh install (the default_collections migration), a seed run before setup,
-- or an old yarn auth:reset (which deleted the user and kept the collection). Nothing is thrown away: a user with
-- no way to sign in is made for them, and the next setup gives that first user their passkey. The handle is only a
-- placeholder; setup replaces it.
INSERT INTO "users" ("name", "webauthn_user_id", "updated_at")
SELECT 'Collector', replace(gen_random_uuid()::text, '-', ''), now()
WHERE NOT EXISTS (SELECT 1 FROM "users") AND EXISTS (SELECT 1 FROM "collections");

-- Every collection that exists today becomes the current user's: the first user, the only one so far.
UPDATE "collections" SET "user_id" = (SELECT min("id") FROM "users");

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
