import RatingStars from '@/components/RatingStars'

interface Session {
  sessionId: string
  trackId: string
  spotifyUrl: string
  spotifyTrackId: string | null
  title: string
  artistName: string
  artworkUrl: string | null
  completedAt: string
  score: number | null
}

interface ListeningHistoryProps {
  sessions: Session[]
}

export default function ListeningHistory({
  sessions,
}: ListeningHistoryProps) {
  if (sessions.length === 0) {
    return (
      <div className="surface-card-soft p-6 text-sm leading-7 text-slate-400">
        No completed listening sessions yet. Start with the queue to build your
        credit history.
      </div>
    )
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="hidden grid-cols-[minmax(0,2fr)_0.75fr_0.85fr] gap-4 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[0.22em] text-slate-500 md:grid">
        <span>Track</span>
        <span>Date</span>
        <span>Rating</span>
      </div>

      <div className="divide-y divide-white/6">
        {sessions.map((session) => (
          <div
            key={session.sessionId}
            className="grid gap-4 px-6 py-5 md:grid-cols-[minmax(0,2fr)_0.75fr_0.85fr] md:items-center"
          >
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-white">
                {session.title}
              </p>
              <p className="mt-1 truncate text-sm text-slate-400">
                {session.artistName}
              </p>
            </div>

            <div className="text-sm text-slate-300">
              {new Date(session.completedAt).toLocaleDateString()}
            </div>

            <div className="flex items-center gap-3">
              {session.score ? (
                <>
                  <RatingStars value={session.score} />
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {session.score}/5
                  </span>
                </>
              ) : (
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  No rating
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
