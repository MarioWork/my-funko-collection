-- Temporary passwords (docs/adr/0002-passwords-next-to-passkeys.md): an admin creates a user with an app-made
-- password that dies 7 days after it was made unless the user replaces it first. Null for a password the user chose.
ALTER TABLE "users" ADD COLUMN     "temporary_password_expires_at" TIMESTAMPTZ(3);

-- A temporary password is still a password: the expiry never stands without a hash. Kept by hand (Prisma ignores
-- checks).
ALTER TABLE "users" ADD CONSTRAINT "users_temporary_password_chk"
  CHECK ("temporary_password_expires_at" IS NULL OR "password_hash" IS NOT NULL);
