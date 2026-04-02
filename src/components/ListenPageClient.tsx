'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SpotifyEmbed from '@/components/SpotifyEmbed'
import ListeningTimer from '@/components/ListeningTimer'
import RatingForm from '@/components/RatingForm'
import { useListeningSession } from '@/hooks/useListeningSession'

interface Props {
  /** The DB Track.id (cuid) */
  trackId: string
  /** The DB ListeningSession.id (cuid) */
  sessionId: string
}

/**
 * Orchestrates the full listening experience:
 * - Renders the Spotify embed using the Track.spotifyUrl fetched from the API
 * - Runs the visibility-aware timer via useListeningSession
 * - Shows the locked RatingForm that unlocks at 30s
 * - Handles the success state and redirect to /dashboard
 */
export default function ListenPageClient({ trackId, sessionId }: Props) {
  const router = useRouter()
  const { started, startTimer, accumulatedMs, displayMs, isEligible } = useListeningSession()

  // We fetch the track's spotifyUrl so we can extract the Spotify track ID for the embed
  const [spotifyTrackId, setSpotifyTrackId] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Credit success state
  const [earnedCredit, setEarnedCredit] = useState(false)
  const [newCredits, setNewCredits] = useState<number | null>(null)

  useEffect(() => {
    async function loadTrack() {
      try {
        const res = await fetch(`/api/tracks/${trackId}`)
        if (!res.ok) {
          setFetchError('Track not found.')
          return
        }
        const data = await res.json()
        // Extract the 22-char Spotify ID from the stored URL
        const match = data.spotifyUrl?.match(
          /https:\/\/open\.spotify\.com\/track\/([A-Za-z0-9]{22})/
        )
        if (match) {
          setSpotifyTrackId(match[1])
        } else {
          setFetchError('Invalid Spotify URL stored for this track.')
        }
      } catch {
        setFetchError('Failed to load track details.')
      }
    }
    loadTrack()
  }, [trackId])

  function handleRatingSuccess(credits: number) {
    setEarnedCredit(true)
    setNewCredits(credits)
    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 2000)
  }

  // Success screen
  if (earnedCredit) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">+1 credit earned!</h2>
        <p className="text-gray-400">
          Your new balance:{' '}
          <span className="text-green-400 font-semibold">{newCredits} credits</span>
        </p>
        <p className="text-gray-500 text-sm mt-4">Redirecting to dashboard...</p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <p className="text-red-400 text-lg mb-4">{fetchError}</p>
        <a href="/dashboard" className="text-green-400 underline">
          Back to Dashboard
        </a>
      </div>
    )
  }

  if (!spotifyTrackId) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="animate-spin text-4xl mb-4">⟳</div>
        <p className="text-gray-400">Loading track...</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Listen & Rate</h1>
        <p className="text-gray-400 text-sm">
          Keep this tab open and listen for 30 seconds, then rate the track to earn +1 credit.
        </p>
      </div>

      {/* Spotify embed player */}
      <SpotifyEmbed trackId={spotifyTrackId} />

      {/* Visibility-aware timer — only starts after user confirms they pressed play */}
      <ListeningTimer
        started={started}
        displayMs={displayMs}
        isEligible={isEligible}
        onStart={startTimer}
      />

      {/* Rating form — locked until 30s threshold */}
      <RatingForm
        sessionId={sessionId}
        isEligible={isEligible}
        accumulatedMs={displayMs}
        onSuccess={handleRatingSuccess}
      />

      <p className="text-center text-xs text-gray-600">
        Session ID: {sessionId}
      </p>
    </div>
  )
}
