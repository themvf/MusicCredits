import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleApiError, ApiRouteError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/nextjs/server'
import { sendCuratorApprovalEmail, sendCuratorRejectionEmail } from '@/lib/email'

export const runtime = 'nodejs'

export const REJECTION_REASONS = [
  'Playlist not a strong genre fit for the platform',
  'Follower count meets threshold but audience appears inactive',
  'Insufficient platform activity to assess quality',
  'Playlist content policy concern',
] as const

const reviewSchema = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('approve') }),
  z.object({
    decision: z.literal('reject'),
    reason: z.enum(REJECTION_REASONS),
    internalNote: z.string().max(500).optional(),
  }),
])

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAuthenticatedUser()
    if (admin.role !== 'admin') throw new ApiRouteError(403, 'Admin access required')

    const { id: applicationId } = await params

    const body = await req.json()
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const application = await prisma.curatorApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: true,
        playlists: {
          where: { spotifyCheckStatus: 'passed' },
        },
      },
    })

    if (!application) throw new ApiRouteError(404, 'Application not found')
    if (application.status !== 'pending') {
      throw new ApiRouteError(409, 'Application has already been reviewed')
    }

    const clerk = await clerkClient()
    const clerkUser = await clerk.users.getUser(application.user.clerkId)
    const applicantEmail = clerkUser.emailAddresses[0]?.emailAddress

    if (parsed.data.decision === 'approve') {
      // ─── APPROVAL ─────────────────────────────────────────────────────────
      // One transaction: CuratorProfile + CuratorPlaylist rows + role update + application update
      const [curatorProfile] = await prisma.$transaction([
        prisma.curatorProfile.create({
          data: {
            userId: application.userId,
            status: 'active',
            playlists: {
              create: application.playlists.map((p) => ({
                spotifyPlaylistId: p.spotifyPlaylistId,
                playlistName: p.playlistName ?? p.spotifyPlaylistId,
                followers: p.followerCountAtApply ?? 0,
                genres: p.genres,
              })),
            },
          },
        }),
        prisma.user.update({
          where: { id: application.userId },
          data: { role: 'both' },
        }),
        prisma.curatorApplication.update({
          where: { id: applicationId },
          data: {
            status: 'approved',
            reviewedBy: admin.id,
            reviewedAt: new Date(),
          },
        }),
      ])

      await prisma.curatorApplication.update({
        where: { id: applicationId },
        data: { curatorProfileId: curatorProfile.id },
      })

      if (applicantEmail) {
        sendCuratorApprovalEmail(applicantEmail).catch((err) =>
          console.error('[admin/review] Approval email failed', err)
        )
      }

      return NextResponse.json({ status: 'approved' })
    }

    // ─── REJECTION ──────────────────────────────────────────────────────────
    const { reason } = parsed.data

    await prisma.curatorApplication.update({
      where: { id: applicationId },
      data: {
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    })

    if (applicantEmail) {
      sendCuratorRejectionEmail(applicantEmail, reason, false).catch((err) =>
        console.error('[admin/review] Rejection email failed', err)
      )
    }

    return NextResponse.json({ status: 'rejected' })
  } catch (error) {
    return handleApiError(error, 'POST /api/admin/applications/[id]/review')
  }
}
