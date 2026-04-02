interface Session {
  sessionId: string
  trackId: string
  spotifyUrl: string
  completedAt: string
  score: number | null
}

interface Props {
  sessions: Session[]
}

function Stars({ score }: { score: number | null }) {
  if (!score) return <span className="text-gray-500 text-sm">—</span>
  return (
    <span className="text-yellow-400 text-sm">
      {'★'.repeat(score)}{'☆'.repeat(5 - score)}
    </span>
  )
}

function shortUrl(url: string) {
  const match = url.match(/track\/([A-Za-z0-9]+)/)
  return match ? `spotify:track:${match[1].slice(0, 8)}…` : url
}

export default function ListeningHistory({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <p className="text-gray-500 text-sm py-6 text-center">
        You haven&apos;t completed any listening sessions yet.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {sessions.map((s) => (
        <div
          key={s.sessionId}
          className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4"
        >
          <div className="flex-1 min-w-0">
            <a
              href={s.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 text-sm font-mono truncate block"
            >
              {shortUrl(s.spotifyUrl)}
            </a>
            <p className="text-gray-500 text-xs mt-1">
              {new Date(s.completedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="shrink-0">
            <Stars score={s.score} />
          </div>
        </div>
      ))}
    </div>
  )
}
