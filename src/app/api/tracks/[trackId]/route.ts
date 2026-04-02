import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tracks/[trackId]
 *
 * Returns a single track by its DB id. Used by the listen page to retrieve
 * the spotifyUrl so we can extract the embed track ID on the client.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    await getAuthenticatedUser()

    const { trackId } = await params

    const track = await prisma.track.findUnique({
      where: { id: trackId },
    })

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    return NextResponse.json(track)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[GET /api/tracks/:trackId]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
