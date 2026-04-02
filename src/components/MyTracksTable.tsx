'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Track {
  id: string
  spotifyUrl: string
  createdAt: string
  listenCount: number
  averageRating: number | null
  ratingCount: number
}

interface Props {
  tracks: Track[]
}

function StarDisplay({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-gray-500 text-sm">No ratings yet</span>
  const full = Math.round(rating)
  return (
    <span className="text-yellow-400 text-sm">
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
      <span className="text-gray-400 ml-1">({rating})</span>
    </span>
  )
}

function shortUrl(url: string) {
  // Extract just the track ID portion for display
  const match = url.match(/track\/([A-Za-z0-9]+)/)
  return match ? `spotify:track:${match[1].slice(0, 8)}…` : url
}

export default function MyTracksTable({ tracks }: Props) {
  const router = useRouter()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(trackId: string) {
    setDeletingId(trackId)
    setError(null)

    try {
      const res = await fetch(`/api/tracks/${trackId}`, { method: 'DELETE' })
      if (!res.ok) {
        setError('Failed to delete track. Please try again.')
        setDeletingId(null)
        return
      }
      // Refresh server components so the table updates
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  if (tracks.length === 0) {
    return (
      <p className="text-gray-500 text-sm py-6 text-center">
        You haven&apos;t submitted any tracks yet.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {tracks.map((track) => (
        <div
          key={track.id}
          className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
        >
          {/* Track info */}
          <div className="flex-1 min-w-0">
            <a
              href={track.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 text-sm font-mono truncate block"
            >
              {shortUrl(track.spotifyUrl)}
            </a>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
              <span>{new Date(track.createdAt).toLocaleDateString()}</span>
              <span>{track.listenCount} listen{track.listenCount !== 1 ? 's' : ''}</span>
              <StarDisplay rating={track.averageRating} />
            </div>
          </div>

          {/* Delete controls */}
          <div className="flex items-center gap-2 shrink-0">
            {confirmId === track.id ? (
              <>
                <span className="text-xs text-gray-400">Remove this track?</span>
                <button
                  onClick={() => handleDelete(track.id)}
                  disabled={deletingId === track.id}
                  className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {deletingId === track.id ? 'Removing…' : 'Confirm'}
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmId(track.id)}
                className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-red-400 hover:text-red-300 border border-gray-700 rounded-lg transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
