import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiRouteError, handleApiError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  addTrackToPlaylistWithPlatformToken,
  assertPlaylistVerificationEligibility,
  fetchSpotifyPlaylistDetailForPlatform,
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

    if (existingVerification?.verified) {
      throw new ApiRouteError(409, 'This track has already been verified for your account')
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

    const { spotifyTrackUri } = await requireTrackSpotifyId(body.trackId)
    const addResult = await addTrackToPlaylistWithPlatformToken(
      playlist.spotifyPlaylistId,
      spotifyTrackUri
    )

    const now = new Date()
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
        verified: true,
        quality: 'verified',
        verifiedAt: now,
        lastCheckedAt: now,
      },
      update: {
        playlistId: playlist.id,
        verified: true,
        quality: 'verified',
        verifiedAt: now,
        lastCheckedAt: now,
      },
    })

    return NextResponse.json({
      verificationId: verification.id,
      verified: verification.verified,
      quality: verification.quality,
      snapshotId: addResult.snapshot_id,
    })
  } catch (error) {
    return handleApiError(error, 'POST /api/playlist/add')
  }
}
