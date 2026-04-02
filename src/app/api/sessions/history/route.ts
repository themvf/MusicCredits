import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
        track: { select: { spotifyUrl: true } },
        rating: { select: { score: true } },
      },
    })

    const history = sessions.map((s) => ({
      sessionId: s.id,
      trackId: s.trackId,
      spotifyUrl: s.track.spotifyUrl,
      completedAt: s.startedAt,
      score: s.rating?.score ?? null,
    }))

    return NextResponse.json(history)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[GET /api/sessions/history]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
