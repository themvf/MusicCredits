'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SpotifyEmbed from '@/components/SpotifyEmbed'
import ListeningTimer from '@/components/ListeningTimer'
import RatingForm from '@/components/RatingForm'
import { useListeningSession } from '@/hooks/useListeningSession'

interface Props {
  trackId: string
  sessionId: string
}

/**
 * Orchestrates the full listening experience.
 *
 * Playback state flow:
 *   SpotifyEmbed → onPlaybackUpdate → isPlaying state
 *   isPlaying → useListeningSession → displayMs / isEligible
 *   displayMs / isEligible → ListeningTimer + RatingForm
 *
 * Time only accumulates when the Spotify IFrame API reports isPaused=false
 * AND the tab is visible. Pausing or switching tabs both stop the timer.
 */
export default function ListenPageClient({ trackId, sessionId }: Props) {
  const router = useRouter()

  // Real playback state from the Spotify IFrame API
  const [isPlaying, setIsPlaying] = useState(false)

  const [fetchError, setFetchError] = useState<string | null>(null)
  const [spotifyTrackId, setSpotifyTrackId] = useState<string | null>(null)
  const [earnedCredit, setEarnedCredit] = useState(false)
  const [newCredits, setNewCredits] = useState<number | null>(null)

  // Timer driven by real playback state — not wall-clock time
  const { displayMs, isEligible } = useListeningSession(isPlaying)

  // Stable callback reference for SpotifyEmbed to avoid re-mounting the embed
  const handlePlaybackUpdate = useCallback(
    ({ isPaused }: { isPaused: boolean; position: number; duration: number }) => {
      setIsPlaying(!isPaused)
    },
    []
  )

  // Fetch the track's spotifyUrl to extract the Spotify track ID for the embed
  useEffect(() => {
    async function loadTrack() {
      try {
        const res = await fetch(`/api/tracks/${trackId}`)
        if (!res.ok) {
          setFetchError('Track not found.')
          return
        }
        const data = await res.json()
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
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 2000)
  }

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
        <p className="text-gray-400">Loading track...</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Listen & Rate</h1>
        <p className="text-gray-400 text-sm">
          Play the track and listen for 30 seconds to earn +1 credit. The timer only runs while audio is playing.
        </p>
      </div>

      {/* Spotify embed — fires real playback events via IFrame API */}
      <SpotifyEmbed
        trackId={spotifyTrackId}
        onPlaybackUpdate={handlePlaybackUpdate}
      />

      {/* Timer reflects actual playback state */}
      <ListeningTimer
        isPlaying={isPlaying}
        displayMs={displayMs}
        isEligible={isEligible}
      />

      {/* Rating form — locked until genuine 30s of audio consumed */}
      <RatingForm
        sessionId={sessionId}
        isEligible={isEligible}
        accumulatedMs={displayMs}
        onSuccess={handleRatingSuccess}
      />
    </div>
  )
}
