import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    return handleApiError(error, 'GET /api/sessions/history')
  }
}
