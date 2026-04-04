import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiRouteError, handleApiError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  assertPlaylistVerificationEligibility,
  fetchPlaylistTrackIdsForUser,
  getTrackIdsFromSnapshot,
  PLAYLIST_VERIFY_DELAY_MS,
  requireTrackSpotifyId,
} from '@/lib/spotify-api'

export const runtime = 'nodejs'

const verifySnapshotSchema = z.object({
  snapshotId: z.string().cuid('snapshotId must be a valid cuid'),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const body = verifySnapshotSchema.parse(await req.json())

    const snapshot = await prisma.playlistSnapshot.findUnique({
      where: { id: body.snapshotId },
      include: {
        playlist: true,
      },
    })

    if (!snapshot || snapshot.userId !== user.id) {
      throw new ApiRouteError(404, 'Snapshot not found')
    }

    await assertPlaylistVerificationEligibility(user.id, snapshot.trackId)

    const msUntilAllowed =
      snapshot.createdAt.getTime() + PLAYLIST_VERIFY_DELAY_MS - Date.now()

    if (msUntilAllowed > 0) {
      throw new ApiRouteError(
        429,
        `Verification is cooling down. Try again in ${Math.ceil(msUntilAllowed / 1000)} seconds`
      )
    }

    const { spotifyTrackId } = await requireTrackSpotifyId(snapshot.trackId)
    const beforeTrackIds = getTrackIdsFromSnapshot(snapshot.trackIds)
    const afterTrackIds = await fetchPlaylistTrackIdsForUser(
      user.id,
      snapshot.playlist.spotifyPlaylistId
    )

    const verified =
      afterTrackIds.includes(spotifyTrackId) &&
      !beforeTrackIds.includes(spotifyTrackId)

    const now = new Date()

    const verification = await prisma.playlistVerification.upsert({
      where: {
        userId_trackId: {
          userId: user.id,
          trackId: snapshot.trackId,
        },
      },
      create: {
        userId: user.id,
        trackId: snapshot.trackId,
        playlistId: snapshot.playlistId,
        snapshotId: snapshot.id,
        verified,
        quality: verified ? 'verified' : 'failed',
        verifiedAt: verified ? now : null,
        lastCheckedAt: now,
      },
      update: {
        playlistId: snapshot.playlistId,
        snapshotId: snapshot.id,
        verified,
        quality: verified ? 'verified' : 'failed',
        verifiedAt: verified ? now : null,
        lastCheckedAt: now,
      },
    })

    return NextResponse.json({
      verificationId: verification.id,
      state: verified ? 'verified' : 'failed',
      verified,
      quality: verification.quality,
      verifiedAt: verification.verifiedAt?.toISOString() ?? null,
    })
  } catch (error) {
    return handleApiError(error, 'POST /api/playlist/snapshot/verify')
  }
}
