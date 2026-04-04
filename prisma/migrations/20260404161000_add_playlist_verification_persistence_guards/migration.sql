-- CreateEnum
CREATE TYPE "PlaylistVerificationType" AS ENUM ('snapshot', 'platform');

-- AlterTable
ALTER TABLE "PlaylistVerification"
ADD COLUMN "verificationType" "PlaylistVerificationType",
ADD COLUMN "persistenceDueAt" TIMESTAMP(3);

-- Backfill existing records so the new non-null type is explicit.
UPDATE "PlaylistVerification"
SET "verificationType" = CASE
    WHEN "snapshotId" IS NULL THEN 'platform'::"PlaylistVerificationType"
    ELSE 'snapshot'::"PlaylistVerificationType"
END;

-- Normalize existing records before enforcing state consistency.
UPDATE "PlaylistVerification"
SET "verified" = CASE
    WHEN "quality" = 'verified' THEN TRUE
    ELSE FALSE
END;

-- Finish the non-null/default transition.
ALTER TABLE "PlaylistVerification"
ALTER COLUMN "verificationType" SET NOT NULL,
ALTER COLUMN "verificationType" SET DEFAULT 'snapshot';

-- Keep verified/quality combinations logically consistent at the database layer.
ALTER TABLE "PlaylistVerification"
ADD CONSTRAINT "PlaylistVerification_quality_verified_consistency"
CHECK (
    ("quality" = 'verified' AND "verified" = TRUE)
    OR ("quality" = 'low_quality' AND "verified" = FALSE)
    OR ("quality" = 'pending' AND "verified" = FALSE)
    OR ("quality" = 'failed' AND "verified" = FALSE)
);

-- CreateIndex
CREATE INDEX "PlaylistVerification_persistenceDueAt_idx" ON "PlaylistVerification"("persistenceDueAt");
