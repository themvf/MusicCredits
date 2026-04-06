-- Migration: refactor_curator_playlists
-- Moves from single playlist per application/profile to many playlists.
-- Removes CuratorGenre, adds CuratorPlaylist and CuratorApplicationPlaylist.

-- ─── Enum: add failed_ownership ──────────────────────────────────────────────
ALTER TYPE "SpotifyCheckStatus" ADD VALUE IF NOT EXISTS 'failed_ownership';

-- ─── Drop CuratorGenre ────────────────────────────────────────────────────────
DROP TABLE IF EXISTS "CuratorGenre";

-- ─── CuratorProfile: drop spotifyPlaylistId ──────────────────────────────────
ALTER TABLE "CuratorProfile" DROP COLUMN IF EXISTS "spotifyPlaylistId";

-- ─── CuratorPlaylist ─────────────────────────────────────────────────────────
CREATE TABLE "CuratorPlaylist" (
    "id"                TEXT         NOT NULL,
    "curatorProfileId"  TEXT         NOT NULL,
    "spotifyPlaylistId" TEXT         NOT NULL,
    "playlistName"      TEXT         NOT NULL,
    "followers"         INTEGER      NOT NULL DEFAULT 0,
    "genres"            TEXT[]       NOT NULL DEFAULT '{}',
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CuratorPlaylist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CuratorPlaylist_curatorProfileId_spotifyPlaylistId_key"
    ON "CuratorPlaylist"("curatorProfileId", "spotifyPlaylistId");

CREATE INDEX "CuratorPlaylist_curatorProfileId_idx"
    ON "CuratorPlaylist"("curatorProfileId");

ALTER TABLE "CuratorPlaylist"
    ADD CONSTRAINT "CuratorPlaylist_curatorProfileId_fkey"
    FOREIGN KEY ("curatorProfileId") REFERENCES "CuratorProfile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── CuratorApplication: drop per-playlist fields ────────────────────────────
ALTER TABLE "CuratorApplication"
    DROP COLUMN IF EXISTS "spotifyPlaylistId",
    DROP COLUMN IF EXISTS "playlistName",
    DROP COLUMN IF EXISTS "followerCountAtApply",
    DROP COLUMN IF EXISTS "thresholdMet",
    DROP COLUMN IF EXISTS "spotifyCheckStatus",
    DROP COLUMN IF EXISTS "genres",
    DROP COLUMN IF EXISTS "motivation";

-- ─── CuratorApplicationPlaylist ──────────────────────────────────────────────
CREATE TABLE "CuratorApplicationPlaylist" (
    "id"                   TEXT                  NOT NULL,
    "applicationId"        TEXT                  NOT NULL,
    "spotifyPlaylistId"    TEXT                  NOT NULL,
    "playlistName"         TEXT,
    "followerCountAtApply" INTEGER,
    "thresholdMet"         BOOLEAN,
    "spotifyCheckStatus"   "SpotifyCheckStatus",
    "genres"               TEXT[]                NOT NULL DEFAULT '{}',
    "createdAt"            TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CuratorApplicationPlaylist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CuratorApplicationPlaylist_applicationId_spotifyPlaylistId_key"
    ON "CuratorApplicationPlaylist"("applicationId", "spotifyPlaylistId");

CREATE INDEX "CuratorApplicationPlaylist_applicationId_spotifyCheckStatus_idx"
    ON "CuratorApplicationPlaylist"("applicationId", "spotifyCheckStatus");

ALTER TABLE "CuratorApplicationPlaylist"
    ADD CONSTRAINT "CuratorApplicationPlaylist_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "CuratorApplication"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
