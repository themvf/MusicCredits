'use client'

import { useState } from 'react'

interface Props {
  sessionId: string
  isEligible: boolean
  accumulatedMs: number
  vibe: string  // Required — only rendered after vibe question is answered
  onSuccess: (newCredits: number) => void
}

/**
 * Star rating form locked until the user has accumulated >= 30s of listen time.
 * Submits to POST /api/rate with the sessionId, score, and activeListenTimeMs.
 */
export default function RatingForm({
  sessionId,
  isEligible,
  accumulatedMs,
  vibe,
  onSuccess,
}: Props) {
  const [hoveredStar, setHoveredStar] = useState(0)
  const [selectedStar, setSelectedStar] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const locked = !isEligible

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (locked || selectedStar === 0 || loading) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          score: selectedStar,
          activeListenTimeMs: accumulatedMs,
          vibe,
        }),
      })

      if (res.status === 422) {
        setError('You must listen for at least 30 seconds before rating.')
        setLoading(false)
        return
      }

      if (res.status === 409) {
        setError('This session has already been rated.')
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError('Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      const data = await res.json()
      onSuccess(data.credits)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      className={`bg-gray-900 border border-gray-800 rounded-xl p-5 transition-opacity ${
        locked ? 'opacity-50 pointer-events-none' : 'opacity-100'
      }`}
    >
      <h3 className="text-white font-semibold mb-4">
        {locked ? 'Rating locked — keep listening' : 'Rate this track'}
      </h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Star selector */}
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={locked}
              onMouseEnter={() => !locked && setHoveredStar(star)}
              onMouseLeave={() => !locked && setHoveredStar(0)}
              onClick={() => !locked && setSelectedStar(star)}
              className={`text-4xl transition-transform hover:scale-110 focus:outline-none ${
                star <= (hoveredStar || selectedStar)
                  ? 'star-filled'
                  : 'star-empty'
              }`}
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
        </div>

        {selectedStar > 0 && (
          <p className="text-center text-sm text-gray-400">
            You selected{' '}
            <span className="text-white font-semibold">
              {selectedStar} star{selectedStar !== 1 ? 's' : ''}
            </span>
          </p>
        )}

        {error && (
          <p className="text-center text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={locked || selectedStar === 0 || loading}
          className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Rating (+1 credit)'}
        </button>
      </form>
    </div>
  )
}
