-- Migration: add_persona_tables
-- Adds role-based persona separation: ArtistProfile, CuratorProfile,
-- CuratorApplication, CuratorStatusEvent, PlatformSetting.
-- users.role is never manually set — it is always a consequence of
-- application status (artist default → both on approval).

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE "UserRole" AS ENUM ('artist', 'curator', 'both', 'admin');
CREATE TYPE "CuratorProfileStatus" AS ENUM ('pending', 'active', 'suspended', 'revoked');
CREATE TYPE "CuratorStatusTrigger" AS ENUM ('manual', 'automated');
CREATE TYPE "CuratorApplicationStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "SpotifyCheckStatus" AS ENUM ('passed', 'failed_threshold', 'failed_private', 'failed_api_error');

-- ─── users.role ───────────────────────────────────────────────────────────────

ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'artist';

-- ─── ArtistProfile ───────────────────────────────────────────────────────────

CREATE TABLE "ArtistProfile" (
    "id"          TEXT         NOT NULL,
    "userId"      TEXT         NOT NULL,
    "displayName" TEXT,
    "bio"         TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ArtistProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ArtistProfile_userId_key" ON "ArtistProfile"("userId");

ALTER TABLE "ArtistProfile"
    ADD CONSTRAINT "ArtistProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── CuratorProfile ──────────────────────────────────────────────────────────

CREATE TABLE "CuratorProfile" (
    "id"                TEXT                   NOT NULL,
    "userId"            TEXT                   NOT NULL,
    "spotifyPlaylistId" TEXT                   NOT NULL,
    "displayName"       TEXT,
    "bio"               TEXT,
    "status"            "CuratorProfileStatus" NOT NULL DEFAULT 'active',
    "createdAt"         TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3)           NOT NULL,
    CONSTRAINT "CuratorProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CuratorProfile_userId_key" ON "CuratorProfile"("userId");

ALTER TABLE "CuratorProfile"
    ADD CONSTRAINT "CuratorProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── CuratorGenre ────────────────────────────────────────────────────────────

CREATE TABLE "CuratorGenre" (
    "id"               TEXT NOT NULL,
    "curatorProfileId" TEXT NOT NULL,
    "genre"            TEXT NOT NULL,
    CONSTRAINT "CuratorGenre_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CuratorGenre_curatorProfileId_genre_key"
    ON "CuratorGenre"("curatorProfileId", "genre");

ALTER TABLE "CuratorGenre"
    ADD CONSTRAINT "CuratorGenre_curatorProfileId_fkey"
    FOREIGN KEY ("curatorProfileId") REFERENCES "CuratorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── CuratorApplication ──────────────────────────────────────────────────────

CREATE TABLE "CuratorApplication" (
    "id"                   TEXT                      NOT NULL,
    "userId"               TEXT                      NOT NULL,
    "spotifyPlaylistId"    TEXT                      NOT NULL,
    "followerCountAtApply" INTEGER,
    "thresholdMet"         BOOLEAN,
    "spotifyCheckStatus"   "SpotifyCheckStatus",
    "status"               "CuratorApplicationStatus" NOT NULL DEFAULT 'pending',
    "rejectionReason"      TEXT,
    -- Set on approval in the same tx that creates CuratorProfile and updates role
    "curatorProfileId"     TEXT,
    "reviewedBy"           TEXT,
    "reviewedAt"           TIMESTAMP(3),
    "createdAt"            TIMESTAMP(3)              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3)              NOT NULL,
    CONSTRAINT "CuratorApplication_pkey" PRIMARY KEY ("id")
);

-- One-to-one: a CuratorProfile can be linked from at most one application
CREATE UNIQUE INDEX "CuratorApplication_curatorProfileId_key"
    ON "CuratorApplication"("curatorProfileId");

CREATE INDEX "CuratorApplication_userId_status_idx"
    ON "CuratorApplication"("userId", "status");

ALTER TABLE "CuratorApplication"
    ADD CONSTRAINT "CuratorApplication_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CuratorApplication"
    ADD CONSTRAINT "CuratorApplication_curatorProfileId_fkey"
    FOREIGN KEY ("curatorProfileId") REFERENCES "CuratorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CuratorApplication"
    ADD CONSTRAINT "CuratorApplication_reviewedBy_fkey"
    FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── CuratorStatusEvent ──────────────────────────────────────────────────────

CREATE TABLE "CuratorStatusEvent" (
    "id"               TEXT                   NOT NULL,
    "curatorProfileId" TEXT                   NOT NULL,
    "fromStatus"       "CuratorProfileStatus" NOT NULL,
    "toStatus"         "CuratorProfileStatus" NOT NULL,
    "triggerType"      "CuratorStatusTrigger" NOT NULL,
    -- Null for automated triggers (no human actor)
    "triggeredBy"      TEXT,
    "reason"           TEXT                   NOT NULL,
    "createdAt"        TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CuratorStatusEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CuratorStatusEvent_curatorProfileId_createdAt_idx"
    ON "CuratorStatusEvent"("curatorProfileId", "createdAt");

ALTER TABLE "CuratorStatusEvent"
    ADD CONSTRAINT "CuratorStatusEvent_curatorProfileId_fkey"
    FOREIGN KEY ("curatorProfileId") REFERENCES "CuratorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CuratorStatusEvent"
    ADD CONSTRAINT "CuratorStatusEvent_triggeredBy_fkey"
    FOREIGN KEY ("triggeredBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── PlatformSetting ─────────────────────────────────────────────────────────

CREATE TABLE "PlatformSetting" (
    "key"       TEXT         NOT NULL,
    "value"     TEXT         NOT NULL,
    -- Nullable: system-seeded values have no human actor
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key")
);

ALTER TABLE "PlatformSetting"
    ADD CONSTRAINT "PlatformSetting_updatedBy_fkey"
    FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Seed default platform settings ─────────────────────────────────────────
-- updatedBy is null (system-seeded, no human actor at migration time)

INSERT INTO "PlatformSetting" ("key", "value", "updatedBy", "updatedAt")
VALUES ('curator_min_followers', '500', NULL, NOW());
