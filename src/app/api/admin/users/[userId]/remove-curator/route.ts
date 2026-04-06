import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, ApiRouteError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

/**
 * POST /api/admin/users/[userId]/remove-curator
 *
 * Removes curator status from a user. Useful for testing with limited
 * Spotify accounts, or for permanent revocations.
 *
 * In one transaction:
 *  1. user.role → 'artist'
 *  2. curatorProfile.status → 'revoked'
 *  3. curatorApplication.status → 'revoked' (so they can reapply)
 *
 * CuratorProfile and CuratorPlaylist rows are kept for audit purposes.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await getAuthenticatedUser()
    if (admin.role !== 'admin') throw new ApiRouteError(403, 'Admin access required')

    const { userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    })

    if (!user) throw new ApiRouteError(404, 'User not found')
    if (user.role !== 'both') throw new ApiRouteError(400, 'User is not an active curator')

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { role: 'artist' },
      }),
      prisma.curatorProfile.update({
        where: { userId },
        data: { status: 'revoked' },
      }),
      // Reset approved application so they can reapply with a different account.
      // No reviewedBy = no 30-day cooldown.
      prisma.curatorApplication.updateMany({
        where: { userId, status: 'approved' },
        data: {
          status: 'rejected',
          rejectionReason: 'Curator access removed by admin',
          reviewedBy: null,
        },
      }),
    ])

    return NextResponse.json({ status: 'revoked' })
  } catch (error) {
    return handleApiError(error, 'POST /api/admin/users/[userId]/remove-curator')
  }
}
