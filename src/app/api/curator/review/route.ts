import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleApiError, ApiRouteError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// 32s with 2s buffer for network latency — same threshold as artist listen sessions
const MINIMUM_LISTEN_MS = 32_000

const reviewSchema = z.object({
  sessionId: z.string().cuid(),
  productionScore: z.number().int().min(1).max(5),
  genreFitScore: z.number().int().min(1).max(5),
  overallScore: z.number().int().min(1).max(5),
  notes: z.string().max(500).optional(),
  playlistDecision: z.boolean(),
  // Anti-gaming fields — same as artist listen flow
  activeListenTimeMs: z
    .number()
    .int()
    .min(0)
    .max(600_000, 'activeListenTimeMs cannot exceed 10 minutes'),
  resetsCount: z.number().int().min(0).max(1000).default(0),
})

/**
 * POST /api/curator/review
 *
 * Security layers (same pattern as POST /api/rate):
 *  1. Auth — must be signed in
 *  2. Role — must be an approved curator with active profile
 *  3. Ownership — session must belong to this user
 *  4. Session type — must be a curator review session
 *  5. Idempotency — session must not already be completed
 *  6. Listen time — activeListenTimeMs >= 32s (server-side enforcement)
 *  7. Atomic write — all DB writes in one transaction
 */
export async function POST(req: NextRequest) {
  try {
    // LAYER 1
    const user = await getAuthenticatedUser()

    // LAYER 2
    if (user.role !== 'both') throw new ApiRouteError(403, 'Only approved curators can submit reviews')

    const curatorProfile = await prisma.curatorProfile.findUnique({
      where: { userId: user.id },
      select: { status: true },
    })
    if (!curatorProfile || curatorProfile.status !== 'active') {
      throw new ApiRouteError(403, 'Curator account is not active')
    }

    const body = await req.json()
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const {
      sessionId,
      productionScore,
      genreFitScore,
      overallScore,
      notes,
      playlistDecision,
      activeListenTimeMs,
      resetsCount,
    } = parsed.data

    const session = await prisma.listeningSession.findUnique({
      where: { id: sessionId },
      include: { curatorReview: true },
    })

    // LAYER 3
    if (!session) throw new ApiRouteError(404, 'Session not found')
    if (session.userId !== user.id) throw new ApiRouteError(403, 'Session does not belong to you')

    // LAYER 4
    if (!session.isCuratorReview) throw new ApiRouteError(400, 'Session is not a curator review')

    // LAYER 5
    if (session.completed) throw new ApiRouteError(409, 'Session already completed')
    if (session.curatorReview) throw new ApiRouteError(409, 'Review already submitted')

    // LAYER 6 — server-side listen time enforcement
    if (activeListenTimeMs < MINIMUM_LISTEN_MS) {
      return NextResponse.json(
        { error: 'Must listen for at least 30 seconds before submitting a review' },
        { status: 422 }
      )
    }

    // LAYER 7 — atomic write
    const [, , , updatedUser] = await prisma.$transaction([
      prisma.listeningSession.update({
        where: { id: sessionId },
        data: {
          completed: true,
          activeListenTimeMs,
          playlistAdded: playlistDecision,
        },
      }),
      prisma.curatorReview.create({
        data: {
          sessionId,
          productionScore,
          genreFitScore,
          overallScore,
          notes: notes ?? null,
          playlistDecision,
        },
      }),
      // Behavioral log — same as artist sessions, enables anti-gaming detection
      prisma.listenEvent.create({
        data: {
          sessionId,
          userId: user.id,
          resetsCount,
          listenDurationMs: activeListenTimeMs,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { credits: { increment: 1 } },
      }),
    ])

    return NextResponse.json({ credits: updatedUser.credits, playlistDecision })
  } catch (error) {
    return handleApiError(error, 'POST /api/curator/review')
  }
}
