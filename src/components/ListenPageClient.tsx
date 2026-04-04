'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import FrictionQuestion from '@/components/FrictionQuestion'
import ListeningTimer from '@/components/ListeningTimer'
import RatingForm from '@/components/RatingForm'
import SpotifyEmbed from '@/components/SpotifyEmbed'
import {
  ArrowUpRightIcon,
  BoltIcon,
  CheckIcon,
  HeadphonesIcon,
  SparkIcon,
  WaveformIcon,
} from '@/components/AppIcons'
import { useListeningSession } from '@/hooks/useListeningSession'
import { getSpotifyTrackLabel } from '@/lib/spotify'

interface ListenPageClientProps {
  trackId: string
  sessionId: string
}

export default function ListenPageClient({
  trackId,
  sessionId,
}: ListenPageClientProps) {
  const feedbackRef = useRef<HTMLDivElement | null>(null)
  const eligibleAtRef = useRef<number | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null)
  const [showVibeReward, setShowVibeReward] = useState(false)
  const [timeToVibeMs, setTimeToVibeMs] = useState<number | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [spotifyTrackId, setSpotifyTrackId] = useState<string | null>(null)
  const [spotifyUrl, setSpotifyUrl] = useState<string | null>(null)
  const [trackTitle, setTrackTitle] = useState<string | null>(null)
  const [artistName, setArtistName] = useState<string | null>(null)
  const [earnedCredit, setEarnedCredit] = useState(false)
  const [newCredits, setNewCredits] = useState<number | null>(null)

  const { displayMs, isEligible, interruptionsCount } = useListeningSession(isPlaying)

  useEffect(() => {
    if (isEligible && eligibleAtRef.current === null) {
      eligibleAtRef.current = Date.now()
    }

    if (!isEligible) {
      eligibleAtRef.current = null
      setSelectedVibe(null)
      setShowVibeReward(false)
      setTimeToVibeMs(null)
    }
  }, [isEligible])

  const handlePlaybackUpdate = useCallback(
    ({ isPlaying: playing }: { isPlaying: boolean; position: number }) => {
      setIsPlaying(playing)
    },
    []
  )

  useEffect(() => {
    async function loadTrack() {
      try {
        const res = await fetch(`/api/tracks/${trackId}`)

        if (!res.ok) {
          setFetchError('Track not found in the queue.')
          return
        }

        const data = await res.json()
        const match = data.spotifyUrl?.match(
          /https:\/\/open\.spotify\.com\/track\/([A-Za-z0-9]{22})/
        )

        if (match) {
          setSpotifyTrackId(match[1])
          setSpotifyUrl(data.spotifyUrl)
          setTrackTitle(data.title ?? getSpotifyTrackLabel(data.spotifyUrl))
          setArtistName(data.artistName ?? 'Unknown artist')
        } else {
          setFetchError('The stored Spotify URL is invalid.')
        }
      } catch {
        setFetchError('Failed to load track details.')
      }
    }

    loadTrack()
  }, [trackId])

  function handleVibeSelect(vibe: string) {
    const elapsed = eligibleAtRef.current ? Date.now() - eligibleAtRef.current : null
    setTimeToVibeMs(elapsed)
    setSelectedVibe(vibe)
    setShowVibeReward(true)
    window.setTimeout(() => setShowVibeReward(false), 1400)
  }

  function handleRatingSuccess(credits: number) {
    setEarnedCredit(true)
    setNewCredits(credits)
  }

  function scrollToFeedback() {
    feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (earnedCredit) {
    return (
      <div className="surface-card mx-auto max-w-3xl p-10 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-brand-400/20 bg-brand-500/12 text-brand-300">
          <CheckIcon className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white">
          Credit earned
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-400">
          The session is complete and your balance has been updated.
        </p>
        <div className="mx-auto mt-8 max-w-sm rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            New balance
          </p>
          <p className="mt-3 text-4xl font-semibold text-white">{newCredits}</p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href={`/playlist-verify?trackId=${trackId}`}
            className="button-primary justify-center"
          >
            Add to Playlist
          </Link>
          <Link href="/dashboard" className="button-secondary justify-center">
            Back to dashboard
          </Link>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-400">
          Playlist verification uses live Spotify playlist snapshots to confirm
          the add after your listening session is complete.
        </p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="surface-card p-8 text-center">
        <p className="text-lg font-semibold text-white">{fetchError}</p>
        <p className="mt-2 text-sm text-slate-400">
          Return to the dashboard and start another queued session.
        </p>
      </div>
    )
  }

  if (!spotifyTrackId || !spotifyUrl) {
    return (
      <div className="surface-card p-8 text-sm text-slate-400">
        Loading the next queued track...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <span className="eyebrow-badge">
            <HeadphonesIcon className="h-4 w-4" />
            Listening session
          </span>
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Listen and earn
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-400">
              Accumulate 30 total seconds of playback to unlock your rating and
              move into the playlist step.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="surface-card-soft p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Progress
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {Math.min(Math.floor(displayMs / 1000), 30)}s
            </p>
          </div>
          <div className="surface-card-soft p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Interruptions
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {interruptionsCount}
            </p>
          </div>
          <div className="surface-card-soft p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Reward
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">+1</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="surface-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <WaveformIcon className="h-3.5 w-3.5" />
                  Queue track
                </span>
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    {trackTitle ?? getSpotifyTrackLabel(spotifyUrl)}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {artistName ?? 'Unknown artist'}
                  </p>
                </div>
              </div>

              <a
                href={spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button-secondary"
              >
                Open in Spotify
                <ArrowUpRightIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          <SpotifyEmbed
            trackId={spotifyTrackId}
            onPlaybackUpdate={handlePlaybackUpdate}
          />

          <ListeningTimer
            isPlaying={isPlaying}
            displayMs={displayMs}
            isEligible={isEligible}
            addToPlaylistUrl={spotifyUrl}
            onAdvance={scrollToFeedback}
          />
        </div>

        <div ref={feedbackRef} className="space-y-4">
          <div className="surface-card-soft p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand-300">
                <BoltIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-white">Session rules</p>
                <p className="text-sm text-slate-400">
                  Total play time counts across pauses and scrubbing. Progress
                  only moves while audio is actively playing on this page.
                </p>
              </div>
            </div>
          </div>

          {isEligible && !selectedVibe && !showVibeReward && (
            <FrictionQuestion onSelect={handleVibeSelect} />
          )}

          {showVibeReward && (
            <div className="surface-card p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-400/20 bg-brand-500/12 text-brand-300">
                  <SparkIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-lg font-semibold text-white">
                    Rating unlocked
                  </p>
                  <p className="text-sm leading-6 text-slate-400">
                    Your listen is verified. Submit the rating to collect the credit.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isEligible && selectedVibe && !showVibeReward && (
            <RatingForm
              sessionId={sessionId}
              isEligible={isEligible}
              accumulatedMs={displayMs}
              vibe={selectedVibe}
              resetsCount={interruptionsCount}
              timeToVibeMs={timeToVibeMs}
              onSuccess={handleRatingSuccess}
            />
          )}

          {!isEligible && (
            <div className="surface-card p-6">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
                Waiting for unlock
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                Feedback activates after 30 seconds
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Once the timer completes, the vibe prompt and rating step will
                appear here automatically.
              </p>

              <div className="mt-6 grid grid-cols-5 gap-3">
                {Array.from({ length: 5 }, (_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-4"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="mx-auto h-7 w-7 text-slate-700"
                    >
                      <path
                        d="m12 3 2.7 5.6 6.2.9-4.5 4.4 1 6.1-5.4-2.9-5.6 2.9 1.1-6.1L3 9.5l6.3-.9L12 3Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
