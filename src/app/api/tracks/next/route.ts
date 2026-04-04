import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

/**
 * GET /api/tracks/next
 *
 * Returns the oldest track in the queue that the authenticated user:
 * - did not submit themselves
 * - has not already completed
 *
 * Simple FIFO — no recommendation logic for the MVP.
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser()

    const track = await prisma.track.findFirst({
      where: {
        // Exclude the user's own tracks
        userId: { not: user.id },
        // Exclude tracks this user has already completed
        sessions: {
          none: {
            userId: user.id,
            completed: true,
          },
        },
      },
      orderBy: {
        // FIFO: oldest track first
        createdAt: 'asc',
      },
    })

    if (!track) {
      return NextResponse.json(
        { error: 'No tracks available' },
        { status: 404 }
      )
    }

    return NextResponse.json(track)
  } catch (error) {
    return handleApiError(error, 'GET /api/tracks/next')
  }
}
