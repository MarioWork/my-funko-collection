-- Reference data the app needs: "Owned" (the default collection) and "Wishlist" exist from the first start.
-- Each insert skips a collection that is already there, so databases created before this migration keep theirs.
-- Owned only becomes the default when no other collection is the default yet.
INSERT INTO `collections` (`name`, `notes`, `is_default`)
SELECT 'Owned', 'Everything on the shelves and in the boxes', NOT EXISTS (SELECT 1 FROM `collections` WHERE `is_default` = 1)
WHERE NOT EXISTS (SELECT 1 FROM `collections` WHERE `name` = 'Owned');--> statement-breakpoint
INSERT INTO `collections` (`name`, `notes`, `is_default`)
SELECT 'Wishlist', 'Next buys', 0
WHERE NOT EXISTS (SELECT 1 FROM `collections` WHERE `name` = 'Wishlist');
