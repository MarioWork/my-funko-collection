-- Every user has a role. New users are members; whoever is there today set the app up, so they become an admin.

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "user_role" NOT NULL DEFAULT 'MEMBER';

UPDATE "users" SET "role" = 'ADMIN';
