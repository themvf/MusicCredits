import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleApiError, ApiRouteError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const reviewSchema = z.object({
  sessionId: z.string().cuid(),
  productionScore: z.number().int().min(1).max(5),
  genreFitScore: z.number().int().min(1).max(5),
  overallScore: z.number().int().min(1).max(5),
  notes: z.string().max(500).optional(),
  playlistDecision: z.boolean(),
})

/**
 * POST /api/curator/review
 *
 * Submits a completed curator review. Awards +1 credit on completion.
 * Sets playlistAdded on the session if playlistDecision = true.
 *
 * Security layers:
 *  1. Auth — must be signed in
 *  2. Role  — must be an approved curator (role: both) with active profile
 *  3. Ownership — session must belong to this user
 *  4. Session type — must be a curator review session
 *  5. Idempotency — session must not already be completed
 *  6. Atomic write — all DB writes in one transaction
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    if (user.role !== 'both') {
      throw new ApiRouteError(403, 'Only approved curators can submit reviews')
    }

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
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { sessionId, productionScore, genreFitScore, overallScore, notes, playlistDecision } =
      parsed.data

    const session = await prisma.listeningSession.findUnique({
      where: { id: sessionId },
      include: { curatorReview: true },
    })

    if (!session) throw new ApiRouteError(404, 'Session not found')
    if (session.userId !== user.id) throw new ApiRouteError(403, 'Session does not belong to you')
    if (!session.isCuratorReview) throw new ApiRouteError(400, 'Session is not a curator review')
    if (session.completed) throw new ApiRouteError(409, 'Session already completed')
    if (session.curatorReview) throw new ApiRouteError(409, 'Review already submitted')

    const [, , updatedUser] = await prisma.$transaction([
      prisma.listeningSession.update({
        where: { id: sessionId },
        data: {
          completed: true,
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
      prisma.user.update({
        where: { id: user.id },
        data: { credits: { increment: 1 } },
      }),
    ])

    return NextResponse.json({ credits: updatedUser.credits })
  } catch (error) {
    return handleApiError(error, 'POST /api/curator/review')
  }
}
