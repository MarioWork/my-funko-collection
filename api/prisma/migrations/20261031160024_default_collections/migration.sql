-- Reference data the app needs: "Owned" (the default collection) and "Wishlist" exist from the first start.
-- Each insert skips a collection that is already there.
-- Owned only becomes the default when no other collection is the default yet.
INSERT INTO "collections" ("name", "notes", "is_default")
VALUES ('Owned', 'Everything on the shelves and in the boxes', NOT EXISTS (SELECT 1 FROM "collections" WHERE "is_default"))
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "collections" ("name", "notes", "is_default")
VALUES ('Wishlist', 'Next buys', false)
ON CONFLICT ("name") DO NOTHING;
