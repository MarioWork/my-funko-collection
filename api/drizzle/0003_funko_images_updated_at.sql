-- drizzle-kit writes this change as `ALTER TABLE ... ADD updated_at ... DEFAULT (expression)`, which SQLite refuses
-- ("Cannot add a column with non-constant default"). So the table is rebuilt by hand, the way drizzle-kit rebuilds
-- SQLite tables: new table, copy the rows (an existing image's updated_at starts as its created_at), swap, indexes.
-- No other table references funko_images, so dropping the old one cascades nothing.
CREATE TABLE `__new_funko_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`funko_id` integer NOT NULL,
	`file_key` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`size_bytes` integer NOT NULL,
	`content_hash` text NOT NULL,
	`placeholder` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`funko_id`) REFERENCES `funkos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_funko_images` (`id`, `funko_id`, `file_key`, `width`, `height`, `size_bytes`, `content_hash`, `placeholder`, `position`, `created_at`, `updated_at`)
SELECT `id`, `funko_id`, `file_key`, `width`, `height`, `size_bytes`, `content_hash`, `placeholder`, `position`, `created_at`, `created_at` FROM `funko_images`;--> statement-breakpoint
DROP TABLE `funko_images`;--> statement-breakpoint
ALTER TABLE `__new_funko_images` RENAME TO `funko_images`;--> statement-breakpoint
CREATE INDEX `funko_images_funko_id_position_idx` ON `funko_images` (`funko_id`,`position`);--> statement-breakpoint
CREATE UNIQUE INDEX `funko_images_funko_id_content_hash_uidx` ON `funko_images` (`funko_id`,`content_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `funko_images_file_key_uidx` ON `funko_images` (`file_key`);
