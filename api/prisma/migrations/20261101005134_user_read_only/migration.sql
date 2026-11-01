-- Read-only users (docs/GLOSSARY.md): an admin can limit a user to looking. Nobody is read-only to begin with.
ALTER TABLE "users" ADD COLUMN     "is_read_only" BOOLEAN NOT NULL DEFAULT false;
