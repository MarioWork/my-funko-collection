-- Notifications inside the app: one row per user told, about one funko (docs/GLOSSARY.md "Notification").

-- CreateEnum
CREATE TYPE "notification_kind" AS ENUM ('SUBMISSION_APPROVED', 'SUBMISSION_REJECTED', 'SUBMISSION_SENT', 'SUBMISSION_RESENT');

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "kind" "notification_kind" NOT NULL,
    "funko_id" INTEGER,
    "funko_name" TEXT NOT NULL,
    "reason" TEXT,
    "read_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_funko_id_idx" ON "notifications"("funko_id");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_funko_id_fkey" FOREIGN KEY ("funko_id") REFERENCES "funkos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A reason is never empty, and no longer than a rejection's. Kept by hand (Prisma ignores checks).
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_reason_length_check"
  CHECK (char_length("reason") BETWEEN 1 AND 500);
