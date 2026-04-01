import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const startSessionSchema = z.object({
  trackId: z.string().cuid('trackId must be a valid cuid'),
})

/**
 * POST /api/sessions/start
 *
 * Creates a new ListeningSession for the given track, or resumes an existing
 * incomplete one (idempotent for network retries).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    const body = await req.json()
    const parsed = startSessionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { trackId } = parsed.data

    // Verify the track exists
    const track = await prisma.track.findUnique({ where: { id: trackId } })
    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    // Prevent self-listening
    if (track.userId === user.id) {
      return NextResponse.json(
        { error: 'You cannot listen to your own track' },
        { status: 403 }
      )
    }

    // Check for an existing session for this [user, track] pair
    const existingSession = await prisma.listeningSession.findUnique({
      where: { userId_trackId: { userId: user.id, trackId } },
    })

    if (existingSession) {
      if (existingSession.completed) {
        // Already completed — cannot start another session for the same track
        return NextResponse.json(
          { error: 'You have already completed a session for this track' },
          { status: 409 }
        )
      }
      // Resume the existing incomplete session
      return NextResponse.json(existingSession)
    }

    // Create a fresh session
    const session = await prisma.listeningSession.create({
      data: {
        userId: user.id,
        trackId,
      },
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[POST /api/sessions/start]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
