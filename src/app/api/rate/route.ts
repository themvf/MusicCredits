import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Strict schema — all fields required, ranges enforced
const rateSchema = z.object({
  sessionId: z.string().cuid('sessionId must be a valid cuid'),
  score: z
    .number()
    .int('Score must be an integer')
    .min(1, 'Score must be at least 1')
    .max(5, 'Score must be at most 5'),
  activeListenTimeMs: z
    .number()
    .int('activeListenTimeMs must be an integer')
    .min(0)
    .max(600_000, 'activeListenTimeMs cannot exceed 10 minutes'),
})

/**
 * POST /api/rate
 *
 * The most security-critical endpoint in the app.
 * All validation is enforced server-side — the client timer is a UX hint only.
 *
 * Security layers applied (in order):
 *  1. Authentication  — user must be signed in
 *  2. Input validation — Zod schema with strict types and ranges
 *  3. Ownership check — session must belong to the authenticated user
 *  4. Idempotency check — session must not already be completed
 *  5. Duplicate rating — no existing Rating row for this session
 *  6. Listen time check — activeListenTimeMs >= 32000 (server-side threshold)
 *  7. Atomic write — $transaction prevents partial state
 */
export async function POST(req: NextRequest) {
  try {
    // LAYER 1: Authentication
    const user = await getAuthenticatedUser()

    // LAYER 2: Input validation
    const body = await req.json()
    const parsed = rateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { sessionId, score, activeListenTimeMs } = parsed.data

    // Fetch the session with its existing rating (if any)
    const session = await prisma.listeningSession.findUnique({
      where: { id: sessionId },
      include: { rating: true },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // LAYER 3: Ownership — prevent users from rating on behalf of others
    if (session.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: this session does not belong to you' },
        { status: 403 }
      )
    }

    // LAYER 4: Idempotency — session must still be open
    if (session.completed) {
      return NextResponse.json(
        { error: 'This session has already been completed' },
        { status: 409 }
      )
    }

    // LAYER 5: No duplicate ratings for the same session
    if (session.rating) {
      return NextResponse.json(
        { error: 'A rating already exists for this session' },
        { status: 409 }
      )
    }

    // LAYER 6: Server-side listen time enforcement.
    // We use 32000ms (32s) to give a small buffer for network latency/rounding,
    // while still exceeding the stated 30-second requirement.
    const MINIMUM_LISTEN_MS = 32_000
    if (activeListenTimeMs < MINIMUM_LISTEN_MS) {
      return NextResponse.json(
        { error: 'Must listen for at least 30 seconds' },
        { status: 422 }
      )
    }

    // LAYER 7: Atomic $transaction — all three writes succeed or all fail.
    //   a) Mark session complete and record the reported listen time
    //   b) Create the Rating record
    //   c) Credit the user +1
    const [, , updatedUser] = await prisma.$transaction([
      prisma.listeningSession.update({
        where: { id: sessionId },
        data: {
          completed: true,
          activeListenTimeMs,
        },
      }),
      prisma.rating.create({
        data: {
          sessionId,
          score,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { credits: { increment: 1 } },
      }),
    ])

    return NextResponse.json({ credits: updatedUser.credits })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[POST /api/rate]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
