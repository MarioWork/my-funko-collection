CREATE TABLE `series` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `series_name_uidx` ON `series` (`name`);--> statement-breakpoint
CREATE INDEX `series_created_at_idx` ON `series` (`created_at`);--> statement-breakpoint
-- drizzle-kit leaves the ON DELETE action out of an ADD COLUMN; the snapshot has it, so it is written here by hand.
ALTER TABLE `funkos` ADD `series_id` integer REFERENCES series(id) ON DELETE set null;--> statement-breakpoint
CREATE INDEX `funkos_series_id_idx` ON `funkos` (`series_id`);