-- CreateEnum
CREATE TYPE "funko_type" AS ENUM ('POP', 'POP_DELUXE', 'POP_RIDES', 'POP_MOMENT', 'POP_TOWN', 'POP_ALBUM', 'POP_JUMBO', 'POP_KEYCHAIN', 'SODA', 'BITTY_POP', 'MYSTERY_MINI', 'OTHER');

-- CreateEnum
CREATE TYPE "item_condition" AS ENUM ('MINT_IN_BOX', 'BOX_DAMAGED', 'OUT_OF_BOX');

-- CreateEnum
CREATE TYPE "auth_challenge_purpose" AS ENUM ('SETUP', 'SIGN_IN', 'ADD_PASSKEY');

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funkos" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" "funko_type" NOT NULL DEFAULT 'POP',
    "category_id" INTEGER NOT NULL,
    "series_id" INTEGER,
    "is_chase" BOOLEAN NOT NULL DEFAULT false,
    "exclusive" TEXT NOT NULL DEFAULT '',
    "barcode" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funkos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funko_images" (
    "id" SERIAL NOT NULL,
    "funko_id" INTEGER NOT NULL,
    "file_key" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "content_hash" TEXT NOT NULL,
    "placeholder" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funko_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_items" (
    "id" SERIAL NOT NULL,
    "collection_id" INTEGER NOT NULL,
    "funko_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "condition" "item_condition",
    "purchase_price_cents" INTEGER,
    "purchase_currency" TEXT NOT NULL DEFAULT 'EUR',
    "purchased_at" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_item_tags" (
    "collection_item_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_item_tags_pk" PRIMARY KEY ("collection_item_id","tag_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "webauthn_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passkeys" (
    "id" SERIAL NOT NULL,
    "credential_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "public_key" BYTEA NOT NULL,
    "counter" INTEGER NOT NULL,
    "transports" TEXT[],
    "is_synced" BOOLEAN NOT NULL,
    "last_used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passkeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "passkey_id" INTEGER NOT NULL,
    "signed_in_at" TIMESTAMPTZ(3) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_challenges" (
    "id" SERIAL NOT NULL,
    "challenge" TEXT NOT NULL,
    "purpose" "auth_challenge_purpose" NOT NULL,
    "webauthn_user_id" TEXT,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setup_codes" (
    "id" SERIAL NOT NULL,
    "code_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "setup_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_uidx" ON "categories"("name");

-- CreateIndex
CREATE INDEX "categories_created_at_idx" ON "categories"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "series_name_uidx" ON "series"("name");

-- CreateIndex
CREATE INDEX "series_created_at_idx" ON "series"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "funkos_barcode_uidx" ON "funkos"("barcode");

-- CreateIndex
CREATE INDEX "funkos_category_id_idx" ON "funkos"("category_id");

-- CreateIndex
CREATE INDEX "funkos_series_id_idx" ON "funkos"("series_id");

-- CreateIndex
CREATE INDEX "funkos_name_idx" ON "funkos"("name");

-- CreateIndex
CREATE INDEX "funkos_created_at_idx" ON "funkos"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "funkos_identity_uidx" ON "funkos"("category_id", "number", "name", "is_chase", "exclusive");

-- CreateIndex
CREATE UNIQUE INDEX "funko_images_file_key_uidx" ON "funko_images"("file_key");

-- CreateIndex
CREATE INDEX "funko_images_funko_id_position_idx" ON "funko_images"("funko_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "funko_images_funko_id_content_hash_uidx" ON "funko_images"("funko_id", "content_hash");

-- CreateIndex
CREATE UNIQUE INDEX "collections_name_uidx" ON "collections"("name");

-- CreateIndex
CREATE INDEX "collections_created_at_idx" ON "collections"("created_at");

-- CreateIndex
CREATE INDEX "collection_items_funko_id_idx" ON "collection_items"("funko_id");

-- CreateIndex
CREATE INDEX "collection_items_created_at_idx" ON "collection_items"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "collection_items_collection_id_funko_id_uidx" ON "collection_items"("collection_id", "funko_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_uidx" ON "tags"("name");

-- CreateIndex
CREATE INDEX "tags_created_at_idx" ON "tags"("created_at");

-- CreateIndex
CREATE INDEX "collection_item_tags_tag_id_idx" ON "collection_item_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_webauthn_user_id_uidx" ON "users"("webauthn_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "passkeys_credential_id_uidx" ON "passkeys"("credential_id");

-- CreateIndex
CREATE INDEX "passkeys_user_id_idx" ON "passkeys"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_uidx" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_passkey_id_idx" ON "sessions"("passkey_id");

-- CreateIndex
CREATE INDEX "sessions_last_seen_at_idx" ON "sessions"("last_seen_at");

-- CreateIndex
CREATE UNIQUE INDEX "auth_challenges_challenge_uidx" ON "auth_challenges"("challenge");

-- CreateIndex
CREATE INDEX "auth_challenges_expires_at_idx" ON "auth_challenges"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "setup_codes_code_hash_uidx" ON "setup_codes"("code_hash");

-- AddForeignKey
ALTER TABLE "funkos" ADD CONSTRAINT "funkos_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funkos" ADD CONSTRAINT "funkos_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funko_images" ADD CONSTRAINT "funko_images_funko_id_fkey" FOREIGN KEY ("funko_id") REFERENCES "funkos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_funko_id_fkey" FOREIGN KEY ("funko_id") REFERENCES "funkos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_item_tags" ADD CONSTRAINT "collection_item_tags_collection_item_id_fkey" FOREIGN KEY ("collection_item_id") REFERENCES "collection_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_item_tags" ADD CONSTRAINT "collection_item_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passkeys" ADD CONSTRAINT "passkeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_passkey_id_fkey" FOREIGN KEY ("passkey_id") REFERENCES "passkeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rules Prisma's schema language cannot declare, so they live here by hand.

-- One default collection at most.
CREATE UNIQUE INDEX "collections_is_default_uidx" ON "collections"("is_default") WHERE "is_default";

ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_quantity_chk" CHECK ("quantity" > 0);
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_purchase_price_chk" CHECK ("purchase_price_cents" IS NULL OR "purchase_price_cents" >= 0);
