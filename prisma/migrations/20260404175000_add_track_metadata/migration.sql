-- AlterTable
ALTER TABLE "Track"
ADD COLUMN "spotifyTrackId" TEXT,
ADD COLUMN "title" TEXT,
ADD COLUMN "artistName" TEXT,
ADD COLUMN "artworkUrl" TEXT;

-- CreateIndex
CREATE INDEX "Track_spotifyTrackId_idx" ON "Track"("spotifyTrackId");
