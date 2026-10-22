CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_uidx` ON `categories` (`name`);--> statement-breakpoint
CREATE INDEX `categories_created_at_idx` ON `categories` (`created_at`);--> statement-breakpoint
CREATE TABLE `collection_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collection_id` integer NOT NULL,
	`funko_id` integer NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`condition` text,
	`purchase_price_cents` integer,
	`purchase_currency` text DEFAULT 'EUR' NOT NULL,
	`purchased_at` text,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`funko_id`) REFERENCES `funkos`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "collection_items_quantity_chk" CHECK("collection_items"."quantity" > 0),
	CONSTRAINT "collection_items_condition_chk" CHECK("collection_items"."condition" is null or "collection_items"."condition" in ('MINT_IN_BOX', 'BOX_DAMAGED', 'OUT_OF_BOX')),
	CONSTRAINT "collection_items_purchase_price_chk" CHECK("collection_items"."purchase_price_cents" is null or "collection_items"."purchase_price_cents" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collection_items_collection_id_funko_id_uidx` ON `collection_items` (`collection_id`,`funko_id`);--> statement-breakpoint
CREATE INDEX `collection_items_funko_id_idx` ON `collection_items` (`funko_id`);--> statement-breakpoint
CREATE INDEX `collection_items_created_at_idx` ON `collection_items` (`created_at`);--> statement-breakpoint
CREATE TABLE `collection_item_tags` (
	`collection_item_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`collection_item_id`, `tag_id`),
	FOREIGN KEY (`collection_item_id`) REFERENCES `collection_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `collection_item_tags_tag_id_idx` ON `collection_item_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_name_uidx` ON `collections` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `collections_is_default_uidx` ON `collections` (`is_default`) WHERE "collections"."is_default" = 1;--> statement-breakpoint
CREATE INDEX `collections_created_at_idx` ON `collections` (`created_at`);--> statement-breakpoint
CREATE TABLE `funko_images` (
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
	FOREIGN KEY (`funko_id`) REFERENCES `funkos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `funko_images_funko_id_position_idx` ON `funko_images` (`funko_id`,`position`);--> statement-breakpoint
CREATE UNIQUE INDEX `funko_images_funko_id_content_hash_uidx` ON `funko_images` (`funko_id`,`content_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `funko_images_file_key_uidx` ON `funko_images` (`file_key`);--> statement-breakpoint
CREATE TABLE `funkos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`number` text NOT NULL,
	`type` text DEFAULT 'POP' NOT NULL,
	`category_id` integer NOT NULL,
	`is_chase` integer DEFAULT false NOT NULL,
	`exclusive` text DEFAULT '' NOT NULL,
	`barcode` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "funkos_type_chk" CHECK("funkos"."type" in ('POP', 'POP_DELUXE', 'POP_RIDES', 'POP_MOMENT', 'POP_TOWN', 'POP_ALBUM', 'POP_JUMBO', 'POP_KEYCHAIN', 'SODA', 'BITTY_POP', 'MYSTERY_MINI', 'OTHER'))
);
--> statement-breakpoint
CREATE INDEX `funkos_category_id_idx` ON `funkos` (`category_id`);--> statement-breakpoint
CREATE INDEX `funkos_name_idx` ON `funkos` (`name`);--> statement-breakpoint
CREATE INDEX `funkos_created_at_idx` ON `funkos` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `funkos_identity_uidx` ON `funkos` (`category_id`,`number`,`name`,`is_chase`,`exclusive`);--> statement-breakpoint
CREATE UNIQUE INDEX `funkos_barcode_uidx` ON `funkos` (`barcode`) WHERE "funkos"."barcode" is not null;--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_uidx` ON `tags` (`name`);--> statement-breakpoint
CREATE INDEX `tags_created_at_idx` ON `tags` (`created_at`);