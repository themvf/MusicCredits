import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hydrateTrackMetadata } from '@/lib/track-metadata'

export const runtime = 'nodejs'

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

    const metadata = await hydrateTrackMetadata(track)

    return NextResponse.json({
      ...track,
      ...metadata,
    })
  } catch (error) {
    return handleApiError(error, 'GET /api/tracks/:trackId')
  }
}

/**
 * DELETE /api/tracks/[trackId]
 *
 * Deletes a track owned by the authenticated user.
 * Cascade deletes all associated sessions and ratings automatically.
 * Credits are NOT refunded — submitting is a spend action.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const user = await getAuthenticatedUser()

    const { trackId } = await params

    const track = await prisma.track.findUnique({ where: { id: trackId } })

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    // Only the owner can delete their track
    if (track.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.track.delete({ where: { id: trackId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/tracks/:trackId')
  }
}
