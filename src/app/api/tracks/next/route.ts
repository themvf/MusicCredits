import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tracks/next
 *
 * Returns the oldest track in the queue that the authenticated user did not
 * submit themselves. Simple FIFO — no recommendation logic for the MVP.
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser()

    const track = await prisma.track.findFirst({
      where: {
        // Exclude the user's own tracks
        userId: { not: user.id },
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
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[GET /api/tracks/next]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
