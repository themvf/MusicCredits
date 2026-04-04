import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hydrateTrackMetadataList } from '@/lib/track-metadata'

export const runtime = 'nodejs'

/**
 * GET /api/sessions/history
 *
 * Returns the authenticated user's completed listening sessions,
 * including the track URL and the score they gave.
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser()

    const sessions = await prisma.listeningSession.findMany({
      where: { userId: user.id, completed: true },
      orderBy: { startedAt: 'desc' },
      include: {
        track: {
          select: {
            id: true,
            spotifyUrl: true,
            spotifyTrackId: true,
            title: true,
            artistName: true,
            artworkUrl: true,
          },
        },
        rating: { select: { score: true } },
      },
    })

    const hydratedTracks = await hydrateTrackMetadataList(
      sessions.map((session) => session.track)
    )
    const trackById = new Map(
      hydratedTracks.map((track) => [track.id, track] as const)
    )

    const history = sessions.map((session) => {
      const track = trackById.get(session.trackId)

      return {
        sessionId: session.id,
        trackId: session.trackId,
        spotifyUrl: track?.spotifyUrl ?? session.track.spotifyUrl,
        spotifyTrackId: track?.spotifyTrackId ?? session.track.spotifyTrackId,
        title: track?.title ?? session.track.title ?? 'Spotify Track',
        artistName:
          track?.artistName ?? session.track.artistName ?? 'Unknown artist',
        artworkUrl: track?.artworkUrl ?? session.track.artworkUrl,
        completedAt: session.startedAt,
        score: session.rating?.score ?? null,
      }
    })

    return NextResponse.json(history)
  } catch (error) {
    return handleApiError(error, 'GET /api/sessions/history')
  }
}
