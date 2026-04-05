import 'server-only'

import { ApiRouteError } from '@/lib/api-error'
import { prisma } from '@/lib/prisma'
import {
  fetchPlaylistTrackEntriesForPlatform,
  fetchPlaylistTrackEntriesForUser,
  getTrackPositionFromPlaylistEntries,
  PLAYLIST_PERSISTENCE_RECHECK_MS,
  requireTrackSpotifyId,
} from '@/lib/spotify-api'

export function getPendingPlaylistVerificationState() {
  return {
    verified: false,
    quality: 'pending' as const,
  }
}

export function getSnapshotPlaylistVerificationState(isVerified: boolean) {
  return isVerified
    ? {
        verified: true,
        quality: 'verified' as const,
      }
    : {
        verified: false,
        quality: 'failed' as const,
      }
}

export function getPlatformPlaylistVerificationState() {
  return {
    verified: true,
    quality: 'verified' as const,
  }
}

export function getPersistencePlaylistVerificationState(stillPresent: boolean) {
  return stillPresent
    ? {
        verified: true,
        quality: 'verified' as const,
      }
    : {
        verified: false,
        quality: 'low_quality' as const,
      }
}

export function getPlaylistVerificationDueAt(verifiedAt: Date) {
  return new Date(verifiedAt.getTime() + PLAYLIST_PERSISTENCE_RECHECK_MS)
}

export async function fetchCurrentPlaylistTrackEntriesForVerification(verification: {
  userId: string
  verificationType: 'snapshot' | 'platform'
  playlist: {
    spotifyPlaylistId: string
  }
}) {
  return verification.verificationType === 'platform'
    ? fetchPlaylistTrackEntriesForPlatform(verification.playlist.spotifyPlaylistId)
    : fetchPlaylistTrackEntriesForUser(
        verification.userId,
        verification.playlist.spotifyPlaylistId
      )
}

function isPersistenceReconciled(
  persistenceDueAt: Date | null,
  verifiedAt: Date | null,
  lastCheckedAt: Date | null
) {
  if (persistenceDueAt || !verifiedAt || !lastCheckedAt) {
    return false
  }

  return lastCheckedAt.getTime() >= getPlaylistVerificationDueAt(verifiedAt).getTime()
}

export async function reconcilePlaylistVerificationPersistence(
  verificationId: string,
  options?: { allowEarly?: boolean }
) {
  const verification = await prisma.playlistVerification.findUnique({
    where: { id: verificationId },
    include: {
      playlist: true,
    },
  })

  if (!verification) {
    throw new ApiRouteError(404, 'Verification not found')
  }

  if (!verification.verifiedAt) {
    throw new ApiRouteError(409, 'Only completed playlist adds can be re-checked')
  }

  const dueAt =
    verification.persistenceDueAt ?? getPlaylistVerificationDueAt(verification.verifiedAt)

  if (
    isPersistenceReconciled(
      verification.persistenceDueAt,
      verification.verifiedAt,
      verification.lastCheckedAt
    )
  ) {
    return {
      verification,
      stillPresent: verification.verified,
      dueAt,
      alreadyFinalized: true,
    }
  }

  const msUntilAllowed = dueAt.getTime() - Date.now()

  if (!options?.allowEarly && msUntilAllowed > 0) {
    throw new ApiRouteError(
      409,
      `Persistence re-check is not available yet. Try again in ${Math.ceil(msUntilAllowed / 1000)} seconds`
    )
  }

  const { spotifyTrackId } = await requireTrackSpotifyId(verification.trackId)
  const afterTrackEntries =
    await fetchCurrentPlaylistTrackEntriesForVerification(verification)
  const currentTrackPosition = getTrackPositionFromPlaylistEntries(
    afterTrackEntries,
    spotifyTrackId
  )
  const stillPresent = currentTrackPosition !== null
  const nextState = getPersistencePlaylistVerificationState(stillPresent)

  const updated = await prisma.playlistVerification.update({
    where: { id: verification.id },
    data: {
      verified: nextState.verified,
      quality: nextState.quality,
      currentTrackPosition,
      lastCheckedAt: new Date(),
      persistenceDueAt: null,
    },
  })

  return {
    verification: updated,
    stillPresent,
    dueAt,
    alreadyFinalized: false,
  }
}
