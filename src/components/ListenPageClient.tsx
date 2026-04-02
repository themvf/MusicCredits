'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import SpotifyEmbed from '@/components/SpotifyEmbed'
import ListeningTimer from '@/components/ListeningTimer'
import FrictionQuestion from '@/components/FrictionQuestion'
import RatingForm from '@/components/RatingForm'
import { useListeningSession } from '@/hooks/useListeningSession'

// A jump of more than 4 seconds in a single position update = forward seek
const SEEK_THRESHOLD_SECONDS = 4

interface Props {
  trackId: string
  sessionId: string
}

/**
 * Orchestrates the full anti-gaming listening flow:
 *
 *   1. LISTENING  — timer only runs while Spotify is playing + tab visible
 *   2. INTERRUPTED — pause, tab switch, or forward seek → timer resets to 0
 *   3. ELIGIBLE   — 30 continuous seconds reached → vibe question appears
 *   4. VIBE ANSWERED — user selects a vibe tag → rating form unlocks
 *   5. RATED      — credits awarded, redirect to dashboard
 *
 * Seek detection: we compare successive `position` values from Spotify's
 * postMessage events. A jump > 4s = forward seek = timer reset.
 */
export default function ListenPageClient({ trackId, sessionId }: Props) {
  const router = useRouter()

  // Real playback state from Spotify postMessage
  const [isPlaying, setIsPlaying] = useState(false)

  // Track Spotify position to detect forward seeks
  const prevPositionRef = useRef<number | null>(null)

  // Vibe answer — null until friction question is answered
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null)

  const [fetchError, setFetchError] = useState<string | null>(null)
  const [spotifyTrackId, setSpotifyTrackId] = useState<string | null>(null)
  const [earnedCredit, setEarnedCredit] = useState(false)
  const [newCredits, setNewCredits] = useState<number | null>(null)

  // Timer resets to 0 on any interruption (pause, tab switch, seek)
  const { displayMs, isEligible, reset } = useListeningSession(isPlaying)

  // When timer resets (eligible → not eligible), also clear vibe answer
  useEffect(() => {
    if (!isEligible && selectedVibe !== null) {
      setSelectedVibe(null)
    }
  }, [isEligible, selectedVibe])

  // Stable callback so SpotifyEmbed's message listener doesn't re-register
  const handlePlaybackUpdate = useCallback(
    ({ isPlaying: playing, position }: { isPlaying: boolean; position: number }) => {
      setIsPlaying(playing)

      // Seek detection: only check while audio is playing
      if (playing && prevPositionRef.current !== null) {
        const delta = position - prevPositionRef.current
        // Forward jump larger than threshold = user seeked ahead → reset timer
        if (delta > SEEK_THRESHOLD_SECONDS) {
          reset()
        }
      }
      prevPositionRef.current = position
    },
    [reset]
  )

  // Fetch the track's spotifyUrl to extract the track ID for the embed
  useEffect(() => {
    async function loadTrack() {
      try {
        const res = await fetch(`/api/tracks/${trackId}`)
        if (!res.ok) { setFetchError('Track not found.'); return }
        const data = await res.json()
        const match = data.spotifyUrl?.match(/https:\/\/open\.spotify\.com\/track\/([A-Za-z0-9]{22})/)
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
    setTimeout(() => { router.push('/dashboard'); router.refresh() }, 2000)
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
        <a href="/dashboard" className="text-green-400 underline">Back to Dashboard</a>
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
          Listen for 30 continuous seconds — pausing or switching tabs resets the timer.
        </p>
      </div>

      {/* Spotify embed — fires postMessage playback events */}
      <SpotifyEmbed
        trackId={spotifyTrackId}
        onPlaybackUpdate={handlePlaybackUpdate}
      />

      {/* Live timer — resets on any interruption */}
      <ListeningTimer
        isPlaying={isPlaying}
        displayMs={displayMs}
        isEligible={isEligible}
      />

      {/* Layer 3: Friction question — appears after 30s, before rating */}
      {isEligible && !selectedVibe && (
        <FrictionQuestion onSelect={setSelectedVibe} />
      )}

      {/* Rating form — only unlocks after vibe answered */}
      {isEligible && selectedVibe && (
        <RatingForm
          sessionId={sessionId}
          isEligible={isEligible}
          accumulatedMs={displayMs}
          vibe={selectedVibe}
          onSuccess={handleRatingSuccess}
        />
      )}

      {/* Rating locked state — shown before eligibility */}
      {!isEligible && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 opacity-50">
          <h3 className="text-gray-400 font-semibold mb-4">Rating locked — keep listening</h3>
          <div className="flex gap-2 justify-center">
            {[1,2,3,4,5].map(s => (
              <span key={s} className="text-4xl text-gray-700">★</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
