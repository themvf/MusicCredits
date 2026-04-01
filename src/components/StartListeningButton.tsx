'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Client component: calls GET /api/tracks/next, then POST /api/sessions/start,
 * and navigates to /listen with the resulting trackId and sessionId.
 */
export default function StartListeningButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    setLoading(true)
    setError(null)

    try {
      // 1. Get the next track to listen to
      const trackRes = await fetch('/api/tracks/next')

      if (trackRes.status === 404) {
        setError('No tracks available yet. Be the first to submit one!')
        setLoading(false)
        return
      }

      if (!trackRes.ok) {
        setError('Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      const track = await trackRes.json()

      // 2. Create (or resume) a listening session for this track
      const sessionRes = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: track.id }),
      })

      if (sessionRes.status === 409) {
        setError('You have already completed a session for the only available track.')
        setLoading(false)
        return
      }

      if (!sessionRes.ok) {
        setError('Could not start a session. Please try again.')
        setLoading(false)
        return
      }

      const session = await sessionRes.json()

      // 3. Navigate to the listening page
      router.push(`/listen?trackId=${track.id}&sessionId=${session.id}`)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleStart}
        disabled={loading}
        className="w-full py-2.5 bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-400 text-black font-semibold text-sm rounded-xl transition-colors"
      >
        {loading ? 'Finding a track...' : 'Start Listening (+1 credit)'}
      </button>
      {error && (
        <p className="text-red-400 text-xs text-center">{error}</p>
      )}
    </div>
  )
}
