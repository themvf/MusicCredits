import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import PlaylistVerificationCard from '@/components/PlaylistVerificationCard'
import { ArrowUpRightIcon, CheckIcon, TracksIcon } from '@/components/AppIcons'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function PlaylistVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{
    trackId?: string
    spotify?: string
  }>
}) {
  const { trackId, spotify } = await searchParams

  if (!trackId) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Playlist Verify"
          title="Verify a real playlist add"
          description="Open this flow from a completed listening session to compare Spotify playlist snapshots before and after the add."
          actions={
            <Link href="/listen" className="button-primary">
              Back to listen
            </Link>
          }
        />

        <div className="surface-card p-8">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-white/10 bg-white/[0.04] text-brand-300">
              <TracksIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-semibold text-white">
                No track selected yet
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Finish a listening session first, then launch playlist verification
                from the success screen.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const user = await getAuthenticatedUser()

  const [track, session, spotifyAccount, verification] =
    await Promise.all([
      prisma.track.findUnique({
        where: { id: trackId },
      }),
      prisma.listeningSession.findUnique({
        where: {
          userId_trackId: {
            userId: user.id,
            trackId,
          },
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

  if (!track) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Playlist Verify"
          title="Track not found"
          description="The selected track could not be loaded for playlist verification."
          actions={
            <Link href="/dashboard" className="button-secondary">
              Back to dashboard
            </Link>
          }
        />
      </div>
    )
  }

  const canVerify =
    Boolean(session?.completed) && (session?.activeListenTimeMs ?? 0) >= 30_000

  const connectUrl = `/api/spotify/login?returnTo=${encodeURIComponent(
    `/playlist-verify?trackId=${track.id}`
  )}`

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Playlist Verify"
        title="Confirm a real playlist add"
        description="Capture a before snapshot, add the track in Spotify, and verify the result against fresh playlist data."
        actions={
          <>
            <Link href="/dashboard" className="button-secondary">
              Dashboard
            </Link>
            <Link href="/listen" className="button-ghost gap-1 px-0 py-0">
              Back to listen
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card-soft p-5">
          <CheckIcon className="h-5 w-5 text-brand-300" />
          <p className="mt-4 text-sm font-semibold text-white">30-second gate</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {canVerify
              ? 'Listening requirement complete. You can verify this add now.'
              : 'Finish the listening session before playlist verification unlocks.'}
          </p>
        </div>
        <div className="surface-card-soft p-5">
          <TracksIcon className="h-5 w-5 text-brand-300" />
          <p className="mt-4 text-sm font-semibold text-white">Spotify account</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {spotifyAccount
              ? 'Connected and ready to sync private or collaborative playlists.'
              : 'Connect Spotify to read playlists and compare snapshots.'}
          </p>
        </div>
        <div className="surface-card-soft p-5">
          <ArrowUpRightIcon className="h-5 w-5 text-brand-300" />
          <p className="mt-4 text-sm font-semibold text-white">Anti-gaming</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Every verification uses live Spotify data, not form input.
          </p>
        </div>
      </div>

      <PlaylistVerificationCard
        trackId={track.id}
        spotifyUrl={track.spotifyUrl}
        connectUrl={connectUrl}
        spotifyConnected={Boolean(spotifyAccount)}
        canVerify={canVerify}
        callbackStatus={
          spotify === 'connected' || spotify === 'error' ? spotify : null
        }
        initialSnapshot={
          verification?.quality === 'pending' && verification.snapshot
            ? {
                id: verification.snapshot.id,
                playlistId: verification.snapshot.playlistId,
                createdAt: verification.snapshot.createdAt.toISOString(),
              }
            : null
        }
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
      />
    </div>
  )
}
