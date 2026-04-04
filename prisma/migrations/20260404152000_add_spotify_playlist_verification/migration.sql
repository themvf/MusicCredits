-- CreateEnum
CREATE TYPE "PlaylistSnapshotType" AS ENUM ('before');

-- CreateEnum
CREATE TYPE "PlaylistVerificationQuality" AS ENUM ('pending', 'verified', 'failed', 'low_quality');

-- CreateTable
CREATE TABLE "SpotifyAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spotifyUserId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotifyAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spotifyPlaylistId" TEXT NOT NULL,
    "spotifyUrl" TEXT,
    "name" TEXT NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "trackCount" INTEGER NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "snapshotType" "PlaylistSnapshotType" NOT NULL DEFAULT 'before',
    "trackIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "snapshotId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "quality" "PlaylistVerificationQuality" NOT NULL DEFAULT 'pending',
    "verifiedAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaylistVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyAccount_userId_key" ON "SpotifyAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyAccount_spotifyUserId_key" ON "SpotifyAccount"("spotifyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Playlist_userId_spotifyPlaylistId_key" ON "Playlist"("userId", "spotifyPlaylistId");

-- CreateIndex
CREATE INDEX "Playlist_userId_lastSyncedAt_idx" ON "Playlist"("userId", "lastSyncedAt");

-- CreateIndex
CREATE INDEX "PlaylistSnapshot_userId_trackId_createdAt_idx" ON "PlaylistSnapshot"("userId", "trackId", "createdAt");

-- CreateIndex
CREATE INDEX "PlaylistSnapshot_playlistId_createdAt_idx" ON "PlaylistSnapshot"("playlistId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistVerification_userId_trackId_key" ON "PlaylistVerification"("userId", "trackId");

-- CreateIndex
CREATE INDEX "PlaylistVerification_playlistId_verified_idx" ON "PlaylistVerification"("playlistId", "verified");

-- AddForeignKey
ALTER TABLE "SpotifyAccount" ADD CONSTRAINT "SpotifyAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistSnapshot" ADD CONSTRAINT "PlaylistSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistSnapshot" ADD CONSTRAINT "PlaylistSnapshot_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistSnapshot" ADD CONSTRAINT "PlaylistSnapshot_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistVerification" ADD CONSTRAINT "PlaylistVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistVerification" ADD CONSTRAINT "PlaylistVerification_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistVerification" ADD CONSTRAINT "PlaylistVerification_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistVerification" ADD CONSTRAINT "PlaylistVerification_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "PlaylistSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
