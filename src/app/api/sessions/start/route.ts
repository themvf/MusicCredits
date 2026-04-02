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
 * Creates a new ListeningSession for the given track.
 *
 * Single active session lock:
 *   A user may only have ONE incomplete session at a time. If they already
 *   have an incomplete session for a different track, it is abandoned
 *   (marked completed=false, left as-is) and a new session is created.
 *   This prevents multi-tab farming where a user opens 5 tracks in parallel.
 *
 * Idempotency:
 *   If the user already has an incomplete session for THIS track, we resume
 *   it (return the existing session). Safe to call on page reload.
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

    // Check for an existing session for this specific [user, track] pair
    const existingSession = await prisma.listeningSession.findUnique({
      where: { userId_trackId: { userId: user.id, trackId } },
    })

    if (existingSession) {
      if (existingSession.completed) {
        return NextResponse.json(
          { error: 'You have already completed a session for this track' },
          { status: 409 }
        )
      }
      // Resume the existing incomplete session for this track
      return NextResponse.json(existingSession)
    }

    // SINGLE ACTIVE SESSION LOCK:
    // Check if the user has any OTHER incomplete session (different track).
    // If so, abandon it before creating the new one.
    // This prevents multi-tab farming — user cannot accumulate time on
    // multiple tracks simultaneously.
    const otherActiveSession = await prisma.listeningSession.findFirst({
      where: {
        userId: user.id,
        completed: false,
        trackId: { not: trackId },
      },
    })

    if (otherActiveSession) {
      // Abandon the previous session — it stays in the DB as incomplete
      // so we have a record, but the user cannot earn credits from it.
      // We do NOT delete it so behavioral data is preserved for analytics.
      await prisma.listeningSession.update({
        where: { id: otherActiveSession.id },
        // Mark with a sentinel value so it's queryable as "abandoned"
        // activeListenTimeMs stays as-is for logging purposes
        data: { activeListenTimeMs: -1 },
      })
    }

    // Create a fresh session
    const session = await prisma.listeningSession.create({
      data: { userId: user.id, trackId },
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
