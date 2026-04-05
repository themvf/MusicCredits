import { NextRequest, NextResponse } from 'next/server'
import { ApiRouteError, handleApiError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import { reconcilePlaylistVerificationPersistence } from '@/lib/playlist-verification'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ verificationId: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    const { verificationId } = await params

    const verification = await prisma.playlistVerification.findUnique({
      where: { id: verificationId },
      include: {
        playlist: true,
      },
    })

    if (!verification || verification.userId !== user.id) {
      throw new ApiRouteError(404, 'Verification not found')
    }

    const { verification: updated, stillPresent, alreadyFinalized } =
      await reconcilePlaylistVerificationPersistence(verification.id)

    return NextResponse.json({
      verificationId: updated.id,
      verified: updated.verified,
      quality: updated.quality,
      currentTrackPosition: updated.currentTrackPosition,
      stillPresent,
      alreadyFinalized,
      persistenceDueAt: updated.persistenceDueAt?.toISOString() ?? null,
    })
  } catch (error) {
    return handleApiError(
      error,
      'POST /api/playlist/verifications/:verificationId/recheck'
    )
  }
}
