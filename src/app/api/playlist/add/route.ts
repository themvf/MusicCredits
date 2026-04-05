import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiRouteError, handleApiError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import {
  getPlatformPlaylistVerificationState,
  getPlaylistVerificationDueAt,
} from '@/lib/playlist-verification'
import { schedulePlaylistVerificationPersistenceCheck } from '@/lib/playlist-verification-workflow'
import { prisma } from '@/lib/prisma'
import {
  addTrackToPlaylistWithPlatformToken,
  assertPlaylistVerificationEligibility,
  fetchPlaylistTrackEntriesForPlatform,
  fetchSpotifyPlaylistDetailForPlatform,
  getTrackPositionFromPlaylistEntries,
  requireTrackSpotifyId,
} from '@/lib/spotify-api'

export const runtime = 'nodejs'

const addTrackSchema = z
  .object({
    trackId: z.string().cuid('trackId must be a valid cuid'),
    playlistId: z.string().cuid('playlistId must be a valid cuid').optional(),
    spotifyPlaylistId: z.string().min(1).optional(),
  })
  .refine((value) => Boolean(value.playlistId || value.spotifyPlaylistId), {
    message: 'playlistId or spotifyPlaylistId is required',
    path: ['playlistId'],
  })

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const body = addTrackSchema.parse(await req.json())

    await assertPlaylistVerificationEligibility(user.id, body.trackId)

    const existingVerification = await prisma.playlistVerification.findUnique({
      where: {
        userId_trackId: {
          userId: user.id,
          trackId: body.trackId,
        },
      },
    })

    if (existingVerification?.verifiedAt) {
      throw new ApiRouteError(
        409,
        'This track has already completed playlist verification for your account'
      )
    }

    if (existingVerification?.quality === 'pending' && existingVerification.snapshotId) {
      throw new ApiRouteError(
        409,
        'Finish or replace the current snapshot before using a platform playlist add'
      )
    }

    let playlist =
      body.playlistId
        ? await prisma.playlist.findFirst({
            where: {
              id: body.playlistId,
              userId: user.id,
            },
          })
        : null

    if (!playlist && !body.spotifyPlaylistId) {
      throw new ApiRouteError(404, 'Playlist not found')
    }

    if (!playlist) {
      const detail = await fetchSpotifyPlaylistDetailForPlatform(
        body.spotifyPlaylistId as string
      )

      playlist = await prisma.playlist.upsert({
        where: {
          userId_spotifyPlaylistId: {
            userId: user.id,
            spotifyPlaylistId: detail.id,
          },
        },
        create: {
          userId: user.id,
          spotifyPlaylistId: detail.id,
          spotifyUrl: detail.external_urls?.spotify ?? null,
          name: detail.name,
          followers: detail.followers?.total ?? 0,
          trackCount: detail.tracks.total,
          lastSyncedAt: new Date(),
        },
        update: {
          spotifyUrl: detail.external_urls?.spotify ?? null,
          name: detail.name,
          followers: detail.followers?.total ?? 0,
          trackCount: detail.tracks.total,
          lastSyncedAt: new Date(),
        },
      })
    }

    const { spotifyTrackId, spotifyTrackUri } = await requireTrackSpotifyId(
      body.trackId
    )
    const addResult = await addTrackToPlaylistWithPlatformToken(
      playlist.spotifyPlaylistId,
      spotifyTrackUri
    )

    let currentTrackPosition: number | null = null

    try {
      const afterTrackEntries = await fetchPlaylistTrackEntriesForPlatform(
        playlist.spotifyPlaylistId
      )
      currentTrackPosition = getTrackPositionFromPlaylistEntries(
        afterTrackEntries,
        spotifyTrackId
      )
    } catch (error) {
      console.error(
        '[Platform playlist position lookup failed]',
        playlist.spotifyPlaylistId,
        error
      )
    }

    const now = new Date()
    const nextState = getPlatformPlaylistVerificationState()
    const persistenceDueAt = getPlaylistVerificationDueAt(now)
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
        verificationType: 'platform',
        snapshotId: null,
        verified: nextState.verified,
        quality: nextState.quality,
        currentTrackPosition,
        verifiedAt: now,
        lastCheckedAt: now,
        persistenceDueAt,
      },
      update: {
        playlistId: playlist.id,
        verificationType: 'platform',
        snapshotId: null,
        verified: nextState.verified,
        quality: nextState.quality,
        currentTrackPosition,
        verifiedAt: now,
        lastCheckedAt: now,
        persistenceDueAt,
      },
    })

    await schedulePlaylistVerificationPersistenceCheck(
      verification.id,
      persistenceDueAt
    )

    return NextResponse.json({
      verificationId: verification.id,
      verified: verification.verified,
      quality: verification.quality,
      verificationType: verification.verificationType,
      currentTrackPosition: verification.currentTrackPosition,
      persistenceDueAt: verification.persistenceDueAt?.toISOString() ?? null,
      snapshotId: addResult.snapshot_id,
    })
  } catch (error) {
    return handleApiError(error, 'POST /api/playlist/add')
  }
}
