import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import { ApiRouteError } from '@/lib/api-error'
import { findNextTrackForCurator } from '@/lib/curator-matching'

export const runtime = 'nodejs'

/**
 * GET /api/curator/next-track
 *
 * Returns the next track for the authenticated curator to review.
 * Runs the 3-step matching algorithm: genre overlap, self-exclusion, FIFO.
 * Returns 403 if the user is not an active curator.
 * Returns 404 if no matching tracks are available.
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser()

    if (user.role !== 'both') {
      throw new ApiRouteError(403, 'Only approved curators can access the review queue')
    }

    const track = await findNextTrackForCurator(user.id)

    if (!track) {
      return NextResponse.json({ error: 'No tracks available in your queue' }, { status: 404 })
    }

    return NextResponse.json(track)
  } catch (error) {
    return handleApiError(error, 'GET /api/curator/next-track')
  }
}
