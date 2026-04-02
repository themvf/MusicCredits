'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import SpotifyEmbed from '@/components/SpotifyEmbed'
import ListeningTimer from '@/components/ListeningTimer'
import FrictionQuestion from '@/components/FrictionQuestion'
import RatingForm from '@/components/RatingForm'
import { useListeningSession } from '@/hooks/useListeningSession'

// A position jump > 4s in a single postMessage update = forward seek
const SEEK_THRESHOLD_SECONDS = 4

interface Props {
  trackId: string
  sessionId: string
}

/**
 * Orchestrates the full anti-gaming listening flow:
 *
 *   LISTENING  → timer counts only while Spotify is playing + tab visible
 *   RESET      → any pause / tab switch / forward seek → timer back to 0
 *   ELIGIBLE   → 30 continuous seconds → vibe question appears
 *   VIBE       → user picks a vibe → micro-reward flash → rating unlocks
 *   RATED      → credits awarded → redirect to dashboard
 *
 * Behavioral data collected and sent to backend:
 *   resetsCount   — how many interruptions occurred
 *   timeToVibeMs  — how long user took to answer vibe question after eligibility
 */
export default function ListenPageClient({ trackId, sessionId }: Props) {
  const router = useRouter()

  const [isPlaying, setIsPlaying] = useState(false)
  const prevPositionRef = useRef<number | null>(null)

  // Vibe state
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null)
  const [showVibeReward, setShowVibeReward] = useState(false)
  const eligibleAtRef = useRef<number | null>(null)   // Timestamp when 30s was first hit
  const [timeToVibeMs, setTimeToVibeMs] = useState<number | null>(null)

  const [fetchError, setFetchError] = useState<string | null>(null)
  const [spotifyTrackId, setSpotifyTrackId] = useState<string | null>(null)
  const [earnedCredit, setEarnedCredit] = useState(false)
  const [newCredits, setNewCredits] = useState<number | null>(null)

  const { displayMs, isEligible, resetsCount, reset } = useListeningSession(isPlaying)

  // Record timestamp when eligibility is first reached (for timeToVibeMs)
  useEffect(() => {
    if (isEligible && eligibleAtRef.current === null) {
      eligibleAtRef.current = Date.now()
    }
    // Reset eligibility clock if timer resets
    if (!isEligible) {
      eligibleAtRef.current = null
      setSelectedVibe(null)
      setShowVibeReward(false)
      setTimeToVibeMs(null)
    }
  }, [isEligible])

  function handleVibeSelect(vibe: string) {
    // Compute how long it took to answer the vibe question
    const elapsed = eligibleAtRef.current ? Date.now() - eligibleAtRef.current : null
    setTimeToVibeMs(elapsed)
    setSelectedVibe(vibe)
    // Briefly show the micro-reward before the rating form slides in
    setShowVibeReward(true)
    setTimeout(() => setShowVibeReward(false), 1500)
  }

  // Seek detection — compare successive position values from Spotify postMessage
  const handlePlaybackUpdate = useCallback(
    ({ isPlaying: playing, position }: { isPlaying: boolean; position: number }) => {
      setIsPlaying(playing)

      if (playing && prevPositionRef.current !== null) {
        const delta = position - prevPositionRef.current
        if (delta > SEEK_THRESHOLD_SECONDS) {
          reset()
        }
      }
      prevPositionRef.current = position
    },
    [reset]
  )

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

      <SpotifyEmbed trackId={spotifyTrackId} onPlaybackUpdate={handlePlaybackUpdate} />

      <ListeningTimer isPlaying={isPlaying} displayMs={displayMs} isEligible={isEligible} />

      {/* Step 1: Vibe question — appears after 30s */}
      {isEligible && !selectedVibe && !showVibeReward && (
        <FrictionQuestion onSelect={handleVibeSelect} />
      )}

      {/* Step 2: Micro-reward flash — appears briefly after vibe is selected */}
      {showVibeReward && (
        <div className="bg-green-950 border border-green-700 rounded-xl p-5 text-center animate-pulse">
          <p className="text-green-400 font-semibold text-lg">🎧 Nice — rating unlocked!</p>
          <p className="text-green-600 text-sm mt-1">You&apos;ve verified your listen. Now rate the track.</p>
        </div>
      )}

      {/* Step 3: Rating form — appears after vibe answered and micro-reward fades */}
      {isEligible && selectedVibe && !showVibeReward && (
        <RatingForm
          sessionId={sessionId}
          isEligible={isEligible}
          accumulatedMs={displayMs}
          vibe={selectedVibe}
          resetsCount={resetsCount}
          timeToVibeMs={timeToVibeMs}
          onSuccess={handleRatingSuccess}
        />
      )}

      {/* Locked state — before eligibility */}
      {!isEligible && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 opacity-50 pointer-events-none">
          <h3 className="text-gray-500 font-semibold mb-4">Rating locked — keep listening</h3>
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
