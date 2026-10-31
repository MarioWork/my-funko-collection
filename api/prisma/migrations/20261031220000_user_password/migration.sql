-- Password sign-in, next to passkeys (docs/adr/0002-passwords-next-to-passkeys.md). Both stay null until the user
-- sets a password in Settings.
ALTER TABLE "users" ADD COLUMN     "password_hash" TEXT,
ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_uidx" ON "users"("username");

-- Usernames are compared lower-case: "Mario" and "mario" are one name. Kept by hand (Prisma ignores checks).
ALTER TABLE "users" ADD CONSTRAINT "users_username_lower_chk" CHECK ("username" = lower("username"));
