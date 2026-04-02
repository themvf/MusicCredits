import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tracks/mine
 *
 * Returns all tracks submitted by the authenticated user, enriched with:
 * - completedSessionCount: how many users have finished listening
 * - averageRating: avg score across all ratings received
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser()

    const tracks = await prisma.track.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        sessions: {
          where: { completed: true },
          include: { rating: true },
        },
      },
    })

    // Compute stats per track
    const enriched = tracks.map((track) => {
      const completedSessions = track.sessions
      const ratings = completedSessions
        .map((s) => s.rating?.score)
        .filter((s): s is number => s !== undefined)

      const averageRating =
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : null

      return {
        id: track.id,
        spotifyUrl: track.spotifyUrl,
        createdAt: track.createdAt,
        listenCount: completedSessions.length,
        averageRating,
        ratingCount: ratings.length,
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[GET /api/tracks/mine]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
