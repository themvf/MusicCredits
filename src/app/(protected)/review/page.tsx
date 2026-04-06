import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { findNextTrackForCurator } from '@/lib/curator-matching'
import CuratorReviewClient from '@/components/CuratorReviewClient'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import { ApiRouteError } from '@/lib/api-error'

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; credits?: string; decision?: string }>
}) {
  const user = await getAuthenticatedUser()
  const { submitted, credits, decision } = await searchParams

  if (user.role !== 'both') {
    redirect('/dashboard')
  }

  const curatorProfile = await prisma.curatorProfile.findUnique({
    where: { userId: user.id },
    select: { status: true },
  })

  if (!curatorProfile || curatorProfile.status !== 'active') {
    redirect('/dashboard')
  }

  // Post-submission success state
  if (submitted === '1') {
    return (
      <div className="mx-auto max-w-xl space-y-8">
        <div className="surface-card p-8 text-center">
          <p className="text-4xl">{decision === 'added' ? '🎵' : '✓'}</p>
          <h2 className="mt-4 text-2xl font-black text-white">
            {decision === 'added' ? 'Review submitted — remember to add to Spotify' : 'Review submitted'}
          </h2>
          {decision === 'added' && (
            <p className="mt-2 text-sm text-white/50">
              Open your Spotify playlist and add the track manually. The artist can see your decision.
            </p>
          )}
          {credits && (
            <p className="mt-3 text-sm text-acid font-medium">+1 credit earned · {credits} total</p>
          )}
          <Link href="/review" className="button-primary mt-6 inline-flex">
            Review another track
          </Link>
        </div>
      </div>
    )
  }

  // Find next track for this curator
  const track = await findNextTrackForCurator(user.id)

  if (!track) {
    return (
      <div className="mx-auto max-w-xl space-y-8">
        <PageHeader
          eyebrow="Review queue"
          title="You're all caught up"
          description="New tracks will appear here as they're matched to your genres."
        />
        <div className="surface-card p-6 text-center">
          <p className="text-sm text-white/40">
            No tracks in your queue right now. Check back soon.
          </p>
        </div>
      </div>
    )
  }

  // Create or resume a curator review session
  const existingSession = await prisma.listeningSession.findUnique({
    where: { userId_trackId: { userId: user.id, trackId: track.id } },
  })

  let session = existingSession

  if (!session) {
    session = await prisma.listeningSession.create({
      data: {
        userId: user.id,
        trackId: track.id,
        isCuratorReview: true,
      },
    })
  } else if (session.completed) {
    // This track is already reviewed — matching algorithm should have excluded it,
    // but guard against a race condition by reloading
    redirect('/review')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/40">
          Review queue
        </p>
      </div>

      <CuratorReviewClient
        sessionId={session.id}
        trackId={track.id}
        spotifyUrl={track.spotifyUrl}
        trackTitle={track.title ?? 'Unknown title'}
        artistName={track.artistName ?? 'Unknown artist'}
        artworkUrl={track.artworkUrl}
        genres={track.genres}
        explicit={track.explicit ?? false}
      />
    </div>
  )
}
