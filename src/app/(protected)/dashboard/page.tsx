import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import StartListeningButton from '@/components/StartListeningButton'
import StatCard from '@/components/StatCard'
import MyTracksTable from '@/components/MyTracksTable'
import ListeningHistory from '@/components/ListeningHistory'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()

  // Fetch all data in parallel for performance
  const [myTracks, completedSessions] = await Promise.all([
    // My submitted tracks enriched with session + rating stats
    prisma.track.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        sessions: {
          where: { completed: true },
          include: { rating: true },
        },
      },
    }),
    // My completed listening sessions with track + rating
    prisma.listeningSession.findMany({
      where: { userId: user.id, completed: true },
      orderBy: { startedAt: 'desc' },
      include: {
        track: { select: { spotifyUrl: true } },
        rating: { select: { score: true } },
      },
    }),
  ])

  // Compute enriched track data for the table component
  const enrichedTracks = myTracks.map((track) => {
    const ratings = track.sessions
      .map((s) => s.rating?.score)
      .filter((s): s is number => s !== undefined)
    const averageRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null
    return {
      id: track.id,
      spotifyUrl: track.spotifyUrl,
      createdAt: track.createdAt.toISOString(),
      listenCount: track.sessions.length,
      averageRating,
      ratingCount: ratings.length,
    }
  })

  // Compute overall avg rating received across all my tracks
  const allRatings = myTracks.flatMap((t) =>
    t.sessions.map((s) => s.rating?.score).filter((s): s is number => s !== undefined)
  )
  const overallAvg =
    allRatings.length > 0
      ? (Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10).toFixed(1)
      : '—'

  // History entries for the listening history component
  const historyEntries = completedSessions.map((s) => ({
    sessionId: s.id,
    trackId: s.trackId,
    spotifyUrl: s.track.spotifyUrl,
    completedAt: s.startedAt.toISOString(),
    score: s.rating?.score ?? null,
  }))

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">

      {/* Stats bar */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Credits"
            value={user.credits}
            sub="+1 per listen · −10 per submit"
          />
          <StatCard
            label="Tracks Submitted"
            value={myTracks.length}
            sub="in the queue"
          />
          <StatCard
            label="Sessions Completed"
            value={completedSessions.length}
            sub="tracks listened"
          />
          <StatCard
            label="Avg Rating Received"
            value={overallAvg}
            sub={allRatings.length > 0 ? `from ${allRatings.length} rating${allRatings.length !== 1 ? 's' : ''}` : 'no ratings yet'}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-white">Start Listening</h2>
          <p className="text-gray-400 text-sm flex-1">
            Listen to another artist&apos;s track for 30 seconds and earn +1 credit.
          </p>
          <StartListeningButton />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-white">Submit a Track</h2>
          <p className="text-gray-400 text-sm flex-1">
            Submit your Spotify track to get it heard. Costs 10 credits.{' '}
            {user.credits < 10 && (
              <span className="text-red-400">
                You need {10 - user.credits} more credits.
              </span>
            )}
          </p>
          <Link
            href="/submit"
            className={`w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${
              user.credits >= 10
                ? 'bg-green-500 hover:bg-green-400 text-black'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed pointer-events-none'
            }`}
          >
            Submit Track (10 credits)
          </Link>
        </div>
      </div>

      {/* My submitted tracks */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">
          My Submitted Tracks
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({myTracks.length})
          </span>
        </h2>
        <MyTracksTable tracks={enrichedTracks} />
      </div>

      {/* Listening history */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">
          Listening History
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({completedSessions.length})
          </span>
        </h2>
        <ListeningHistory sessions={historyEntries} />
      </div>

    </div>
  )
}
