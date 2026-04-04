import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiRouteError, handleApiError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  assertPlaylistVerificationEligibility,
  fetchPlaylistTrackIdsForUser,
  PLAYLIST_VERIFY_DELAY_MS,
  requireTrackSpotifyId,
} from '@/lib/spotify-api'

export const runtime = 'nodejs'

const startSnapshotSchema = z.object({
  trackId: z.string().cuid('trackId must be a valid cuid'),
  playlistId: z.string().cuid('playlistId must be a valid cuid'),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const body = startSnapshotSchema.parse(await req.json())

    await assertPlaylistVerificationEligibility(user.id, body.trackId)

    const playlist = await prisma.playlist.findFirst({
      where: {
        id: body.playlistId,
        userId: user.id,
      },
    })

    if (!playlist) {
      throw new ApiRouteError(404, 'Playlist not found')
    }

    const existingVerification = await prisma.playlistVerification.findUnique({
      where: {
        userId_trackId: {
          userId: user.id,
          trackId: body.trackId,
        },
      },
    })

    if (existingVerification?.verified) {
      throw new ApiRouteError(409, 'This track has already been verified for your account')
    }

    const { spotifyTrackId } = await requireTrackSpotifyId(body.trackId)
    const beforeTrackIds = await fetchPlaylistTrackIdsForUser(
      user.id,
      playlist.spotifyPlaylistId
    )

    if (beforeTrackIds.includes(spotifyTrackId)) {
      throw new ApiRouteError(
        409,
        'This playlist already contains the track, so a new add cannot be verified'
      )
    }

    const snapshot = await prisma.playlistSnapshot.create({
      data: {
        userId: user.id,
        playlistId: playlist.id,
        trackId: body.trackId,
        snapshotType: 'before',
        trackIds: beforeTrackIds,
      },
    })

    const verification = await prisma.playlistVerification.upsert({
      where: {
        userId_trackId: {
          userId: user.id,
          trackId: body.trackId,
        },
      },
      create: {
        userId: user.id,
        trackId: body.trackId,
        playlistId: playlist.id,
        snapshotId: snapshot.id,
        verified: false,
        quality: 'pending',
      },
      update: {
        playlistId: playlist.id,
        snapshotId: snapshot.id,
        verified: false,
        quality: 'pending',
        verifiedAt: null,
        lastCheckedAt: null,
      },
    })

    return NextResponse.json({
      snapshotId: snapshot.id,
      verificationId: verification.id,
      state: 'snapshot_taken',
      createdAt: snapshot.createdAt.toISOString(),
      verifyAfter: new Date(
        snapshot.createdAt.getTime() + PLAYLIST_VERIFY_DELAY_MS
      ).toISOString(),
    })
  } catch (error) {
    return handleApiError(error, 'POST /api/playlist/snapshot/start')
  }
}
