-- Tags belong to one user, like collections (docs/adr/0001-shared-catalogue-own-collections.md).

-- AlterTable: nullable first, so the rows already here can be given their user.
ALTER TABLE "tags" ADD COLUMN "user_id" INTEGER;

-- Tags with no user to own them (only on a database that never had a user): a user with no way to sign in is made
-- for them, as in the collections_per_user migration, and the next setup signs in as them.
INSERT INTO "users" ("name", "webauthn_user_id", "updated_at")
SELECT 'Collector', replace(gen_random_uuid()::text, '-', ''), now()
WHERE NOT EXISTS (SELECT 1 FROM "users") AND EXISTS (SELECT 1 FROM "tags");

-- Every tag that exists today becomes the current user's: the first user.
UPDATE "tags" SET "user_id" = (SELECT min("id") FROM "users");

-- Names are unique per user, not across the app: two users may each have a "Box 1".
DROP INDEX "tags_name_uidx";

-- Tags were shared until now, so another user's items may carry one. That user gets their own copy, with the same
-- name and notes, and their items move to it: nobody loses a label, and no item keeps someone else's tag.
INSERT INTO "tags" ("user_id", "name", "notes", "created_at", "updated_at")
SELECT DISTINCT c."user_id", t."name", t."notes", t."created_at", now()
FROM "collection_item_tags" cit
JOIN "collection_items" i ON i."id" = cit."collection_item_id"
JOIN "collections" c ON c."id" = i."collection_id"
JOIN "tags" t ON t."id" = cit."tag_id"
WHERE c."user_id" <> t."user_id";

UPDATE "collection_item_tags" cit
SET "tag_id" = own."id"
FROM "collection_items" i, "collections" c, "tags" t, "tags" own
WHERE i."id" = cit."collection_item_id"
  AND c."id" = i."collection_id"
  AND t."id" = cit."tag_id"
  AND c."user_id" <> t."user_id"
  AND own."user_id" = c."user_id"
  AND own."name" = t."name";

ALTER TABLE "tags" ALTER COLUMN "user_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tags_user_id_name_uidx" ON "tags"("user_id", "name");

-- AddForeignKey: deleting a user deletes their tags, and with them the labels on their items.
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
