import 'server-only'

import { prisma } from '@/lib/prisma'

/**
 * Finds the next track for a curator to review.
 *
 * Three-step algorithm (in order):
 *  1. Genre overlap  — track.genres must share at least one entry with
 *                      the curator's curator_genres (hard filter)
 *  2. Self-exclusion — never show a curator their own tracks
 *  3. Load balance   — FIFO among genre-matched tracks the curator hasn't
 *                      reviewed yet (oldest submitted first)
 *
 * Region preference is deferred until CuratorProfile gains a location field.
 */
export async function findNextTrackForCurator(curatorUserId: string) {
  const curatorProfile = await prisma.curatorProfile.findUnique({
    where: { userId: curatorUserId },
    include: { genres: { select: { genre: true } } },
  })

  if (!curatorProfile || curatorProfile.status !== 'active') return null

  const curatorGenres = curatorProfile.genres.map((g) => g.genre)
  if (curatorGenres.length === 0) return null

  const track = await prisma.track.findFirst({
    where: {
      // Self-exclusion: step 2
      userId: { not: curatorUserId },
      // Genre overlap: step 1 (hasSome = at least one genre matches)
      genres: { hasSome: curatorGenres },
      // Not already reviewed (completed session by this curator)
      sessions: {
        none: {
          userId: curatorUserId,
          completed: true,
        },
      },
    },
    // FIFO load balancing: step 3
    orderBy: { createdAt: 'asc' },
  })

  return track
}
