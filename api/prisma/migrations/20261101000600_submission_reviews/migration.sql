-- Admins review submissions (approve or reject): when it was reviewed, why it was rejected, and when an admin last
-- changed it before approving, so its sender can be told.
ALTER TABLE "funkos" ADD COLUMN     "changed_by_admin_at" TIMESTAMPTZ(3),
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "reviewed_at" TIMESTAMPTZ(3);

-- A rejected funko always says why, and nothing else carries a reason. Kept by hand (Prisma ignores checks).
ALTER TABLE "funkos" ADD CONSTRAINT "funkos_rejection_reason_check"
  CHECK (("status" = 'REJECTED') = ("rejection_reason" IS NOT NULL));
ALTER TABLE "funkos" ADD CONSTRAINT "funkos_rejection_reason_length_check"
  CHECK (char_length("rejection_reason") BETWEEN 1 AND 500);
