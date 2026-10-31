-- A session says how it was opened, and only a passkey session points at a passkey.

-- CreateEnum
CREATE TYPE "sign_in_method" AS ENUM ('PASSKEY', 'PASSWORD');

-- AlterTable: every session so far was opened by a passkey, so they get PASSKEY before the default goes again.
ALTER TABLE "sessions" ADD COLUMN "sign_in_method" "sign_in_method" NOT NULL DEFAULT 'PASSKEY',
ALTER COLUMN "passkey_id" DROP NOT NULL;

ALTER TABLE "sessions" ALTER COLUMN "sign_in_method" DROP DEFAULT;

-- By hand (Prisma cannot declare it): a passkey session names its passkey, any other has none.
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_passkey_id_chk" CHECK (("sign_in_method" = 'PASSKEY') = ("passkey_id" IS NOT NULL));
