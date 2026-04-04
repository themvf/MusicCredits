import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiRouteError, handleApiError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import {
  getPlaylistVerificationDueAt,
  getSnapshotPlaylistVerificationState,
} from '@/lib/playlist-verification'
import { schedulePlaylistVerificationPersistenceCheck } from '@/lib/playlist-verification-workflow'
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

    const currentVerification = await prisma.playlistVerification.findUnique({
      where: {
        userId_trackId: {
          userId: user.id,
          trackId: snapshot.trackId,
        },
      },
    })

    if (currentVerification?.verifiedAt) {
      throw new ApiRouteError(
        409,
        'This track has already completed playlist verification for your account'
      )
    }

    if (currentVerification?.snapshotId && currentVerification.snapshotId !== snapshot.id) {
      throw new ApiRouteError(
        409,
        'A newer snapshot is active for this track. Start again from the latest snapshot.'
      )
    }

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
    const nextState = getSnapshotPlaylistVerificationState(verified)
    const persistenceDueAt = verified ? getPlaylistVerificationDueAt(now) : null

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
        verificationType: 'snapshot',
        verified: nextState.verified,
        quality: nextState.quality,
        verifiedAt: verified ? now : null,
        lastCheckedAt: now,
        persistenceDueAt,
      },
      update: {
        playlistId: snapshot.playlistId,
        snapshotId: snapshot.id,
        verificationType: 'snapshot',
        verified: nextState.verified,
        quality: nextState.quality,
        verifiedAt: verified ? now : null,
        lastCheckedAt: now,
        persistenceDueAt,
      },
    })

    if (verified && persistenceDueAt) {
      await schedulePlaylistVerificationPersistenceCheck(
        verification.id,
        persistenceDueAt
      )
    }

    return NextResponse.json({
      verificationId: verification.id,
      state: verified ? 'verified' : 'failed',
      verified,
      quality: verification.quality,
      verificationType: verification.verificationType,
      verifiedAt: verification.verifiedAt?.toISOString() ?? null,
      persistenceDueAt: verification.persistenceDueAt?.toISOString() ?? null,
    })
  } catch (error) {
    return handleApiError(error, 'POST /api/playlist/snapshot/verify')
  }
}
