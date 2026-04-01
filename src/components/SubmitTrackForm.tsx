'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SPOTIFY_TRACK_URL_REGEX } from '@/lib/spotify'

interface Props {
  credits: number
}

export default function SubmitTrackForm({ credits }: Props) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Client-side format validation for immediate feedback
  const isValidFormat = SPOTIFY_TRACK_URL_REGEX.test(url)
  const canSubmit = credits >= 10 && isValidFormat && !loading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotifyUrl: url.trim() }),
      })

      if (res.status === 402) {
        setError('Not enough credits (need 10). Listen to some tracks first!')
        setLoading(false)
        return
      }

      if (res.status === 400) {
        const body = await res.json()
        setError(body.error || 'Invalid Spotify URL.')
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError('Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      // Success — redirect to dashboard
      router.push('/dashboard')
      router.refresh() // Re-fetch server components so credit balance updates
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="spotifyUrl" className="block text-sm font-medium text-gray-300 mb-2">
          Spotify Track URL
        </label>
        <input
          id="spotifyUrl"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://open.spotify.com/track/..."
          disabled={loading}
          className="w-full bg-gray-900 border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors disabled:opacity-50"
        />
        {url && !isValidFormat && (
          <p className="mt-1.5 text-xs text-red-400">
            Must be a valid Spotify track URL (e.g.
            https://open.spotify.com/track/XXXXXXXXXXXXXXXXXXXXXX)
          </p>
        )}
        {url && isValidFormat && (
          <p className="mt-1.5 text-xs text-green-400">Looks good!</p>
        )}
      </div>

      {credits < 10 && (
        <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">
          You need at least 10 credits to submit a track. You have{' '}
          <strong>{credits}</strong>. Listen to more tracks to earn credits!
        </div>
      )}

      {error && (
        <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-colors"
      >
        {loading ? 'Submitting...' : 'Submit Track (−10 credits)'}
      </button>
    </form>
  )
}
