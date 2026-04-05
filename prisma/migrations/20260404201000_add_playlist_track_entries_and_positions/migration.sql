ALTER TABLE "PlaylistSnapshot"
ADD COLUMN "trackEntries" JSONB;

ALTER TABLE "PlaylistVerification"
ADD COLUMN "currentTrackPosition" INTEGER;
