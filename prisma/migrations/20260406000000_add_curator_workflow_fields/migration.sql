-- Migration: add_curator_workflow_fields
-- Adds fields needed for the full curator application + review workflow.

-- ─── CuratorApplication additions ────────────────────────────────────────────

ALTER TABLE "CuratorApplication"
  ADD COLUMN "playlistName" TEXT,
  ADD COLUMN "genres"       TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN "motivation"   TEXT;

-- ─── ListeningSession additions ──────────────────────────────────────────────

ALTER TABLE "ListeningSession"
  ADD COLUMN "isCuratorReview" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "playlistAdded"   BOOLEAN NOT NULL DEFAULT false;

-- ─── CuratorReview ───────────────────────────────────────────────────────────

CREATE TABLE "CuratorReview" (
    "id"               TEXT         NOT NULL,
    "sessionId"        TEXT         NOT NULL,
    "productionScore"  INTEGER      NOT NULL,
    "genreFitScore"    INTEGER      NOT NULL,
    "overallScore"     INTEGER      NOT NULL,
    "notes"            TEXT,
    "playlistDecision" BOOLEAN      NOT NULL,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CuratorReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CuratorReview_sessionId_key" ON "CuratorReview"("sessionId");

ALTER TABLE "CuratorReview"
  ADD CONSTRAINT "CuratorReview_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "ListeningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
