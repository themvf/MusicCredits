import 'server-only'

import { prisma } from '@/lib/prisma'

/**
 * Finds the next track for a curator to review.
 *
 * Four-step algorithm (in order):
 *  1. Genre overlap  — track.genres must share at least one entry with any
 *                      of the curator's CuratorPlaylist.genres (hard filter)
 *  2. Self-exclusion — never show a curator their own tracks
 *  3. Load balance   — FIFO among eligible tracks not yet reviewed
 *  4. (Region preference deferred until CuratorProfile gains location field)
 */
export async function findNextTrackForCurator(curatorUserId: string) {
  const curatorProfile = await prisma.curatorProfile.findUnique({
    where: { userId: curatorUserId },
    include: { playlists: { select: { genres: true } } },
  })

  if (!curatorProfile || curatorProfile.status !== 'active') return null

  // Flatten all genres across all curator playlists (deduplicated)
  const curatorGenres = [
    ...new Set(curatorProfile.playlists.flatMap((p) => p.genres)),
  ]
  if (curatorGenres.length === 0) return null

  const track = await prisma.track.findFirst({
    where: {
      userId: { not: curatorUserId },
      genres: { hasSome: curatorGenres },
      sessions: {
        none: { userId: curatorUserId, completed: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return track
}

/**
 * Returns the curator's playlists whose genres overlap with the given track.
 * Used on the /review/add page to show only relevant playlists for verification.
 */
export async function findMatchingCuratorPlaylists(
  curatorUserId: string,
  trackGenres: string[]
) {
  const curatorProfile = await prisma.curatorProfile.findUnique({
    where: { userId: curatorUserId },
    include: {
      playlists: true,
    },
  })

  if (!curatorProfile || curatorProfile.status !== 'active') return []

  return curatorProfile.playlists.filter((playlist) =>
    playlist.genres.some((g) => trackGenres.includes(g))
  )
}
