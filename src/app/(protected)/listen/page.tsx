import ListenPageClient from '@/components/ListenPageClient'
import SessionIntroScreen from '@/components/SessionIntroScreen'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hydrateTrackMetadata } from '@/lib/track-metadata'

export default async function ListenPage({
  searchParams,
}: {
  searchParams: Promise<{
    trackId?: string
    sessionId?: string
    spotify?: string
  }>
}) {
  const { trackId, sessionId, spotify } = await searchParams

  if (!trackId || !sessionId) {
    return <SessionIntroScreen />
  }

  const user = await getAuthenticatedUser()

  const [session, spotifyAccount, verification] = await Promise.all([
    prisma.listeningSession.findUnique({
      where: { id: sessionId },
      include: {
        track: true,
        rating: { select: { id: true } },
      },
    }),
    prisma.spotifyAccount.findUnique({
      where: { userId: user.id },
    }),
    prisma.playlistVerification.findUnique({
      where: {
        userId_trackId: {
          userId: user.id,
          trackId,
        },
      },
      include: {
        playlist: true,
        snapshot: true,
      },
    }),
  ])

  if (
    !session ||
    session.userId !== user.id ||
    session.trackId !== trackId ||
    !session.track
  ) {
    return <SessionIntroScreen />
  }

  const track = await hydrateTrackMetadata(session.track)

  return (
    <ListenPageClient
      trackId={trackId}
      sessionId={session.id}
      spotifyTrackId={track.spotifyTrackId}
      spotifyUrl={track.spotifyUrl}
      trackTitle={track.title}
      artistName={track.artistName}
      initialCredits={user.credits}
      spotifyConnected={Boolean(spotifyAccount)}
      callbackStatus={
        spotify === 'connected' || spotify === 'error' ? spotify : null
      }
      sessionCompleted={Boolean(session.rating)}
      initialVerification={
        verification
          ? {
              id: verification.id,
              playlistId: verification.playlistId,
              playlistName: verification.playlist.name,
              playlistUrl: verification.playlist.spotifyUrl,
              verified: verification.verified,
              quality: verification.quality,
              verificationType: verification.verificationType,
              verifiedAt: verification.verifiedAt?.toISOString() ?? null,
              persistenceDueAt:
                verification.persistenceDueAt?.toISOString() ?? null,
            }
          : null
      }
      initialSnapshot={
        verification?.snapshot
          ? {
              id: verification.snapshot.id,
              playlistId: verification.snapshot.playlistId,
              createdAt: verification.snapshot.createdAt.toISOString(),
            }
          : null
      }
    />
  )
}
