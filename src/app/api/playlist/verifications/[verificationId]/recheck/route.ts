import { NextRequest, NextResponse } from 'next/server'
import { ApiRouteError, handleApiError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  fetchPlaylistTrackIdsForUser,
  PLAYLIST_PERSISTENCE_RECHECK_MS,
  requireTrackSpotifyId,
} from '@/lib/spotify-api'

export const runtime = 'nodejs'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ verificationId: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    const { verificationId } = await params

    const verification = await prisma.playlistVerification.findUnique({
      where: { id: verificationId },
      include: {
        playlist: true,
      },
    })

    if (!verification || verification.userId !== user.id) {
      throw new ApiRouteError(404, 'Verification not found')
    }

    if (!verification.verified || !verification.verifiedAt) {
      throw new ApiRouteError(409, 'Only verified playlist adds can be re-checked')
    }

    const msUntilAllowed =
      verification.verifiedAt.getTime() +
      PLAYLIST_PERSISTENCE_RECHECK_MS -
      Date.now()

    if (msUntilAllowed > 0) {
      throw new ApiRouteError(
        409,
        `Persistence re-check is not available yet. Try again in ${Math.ceil(msUntilAllowed / 1000)} seconds`
      )
    }

    const { spotifyTrackId } = await requireTrackSpotifyId(verification.trackId)
    const afterTrackIds = await fetchPlaylistTrackIdsForUser(
      user.id,
      verification.playlist.spotifyPlaylistId
    )
    const stillPresent = afterTrackIds.includes(spotifyTrackId)

    const updated = await prisma.playlistVerification.update({
      where: { id: verification.id },
      data: {
        quality: stillPresent ? 'verified' : 'low_quality',
        lastCheckedAt: new Date(),
      },
    })

    return NextResponse.json({
      verificationId: updated.id,
      verified: updated.verified,
      quality: updated.quality,
      stillPresent,
    })
  } catch (error) {
    return handleApiError(
      error,
      'POST /api/playlist/verifications/:verificationId/recheck'
    )
  }
}
