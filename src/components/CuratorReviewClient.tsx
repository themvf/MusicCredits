'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import SpotifyEmbed from '@/components/SpotifyEmbed'
import ListenProgressBar from '@/components/ListenProgressBar'
import StatusToast from '@/components/StatusToast'
import { useListeningSession } from '@/hooks/useListeningSession'
import { extractSpotifyTrackId } from '@/lib/spotify'

interface Props {
  sessionId: string
  trackId: string
  spotifyUrl: string
  trackTitle: string
  artistName: string
  artworkUrl: string | null
  genres: string[]
  explicit: boolean
}

const SCORE_LABELS = ['', 'Weak', 'Below avg', 'Average', 'Strong', 'Excellent']

function ScorePicker({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-white/50">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition',
              disabled
                ? 'cursor-not-allowed border-white/5 text-white/20'
                : value === n
                  ? 'border-acid/40 bg-acid/10 text-acid'
                  : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'
            )}
          >
            {n}
          </button>
        ))}
        {value > 0 && !disabled && (
          <span className="self-center pl-1 text-xs text-white/30">
            {SCORE_LABELS[value]}
          </span>
        )}
      </div>
    </div>
  )
}

export default function CuratorReviewClient({
  sessionId,
  trackId,
  spotifyUrl,
  trackTitle,
  artistName,
  artworkUrl,
  genres,
  explicit,
}: Props) {
  const router = useRouter()
  const [isPlaying, setIsPlaying] = useState(false)
  const { displayMs, isEligible, interruptionsCount } = useListeningSession(isPlaying)

  const [productionScore, setProductionScore] = useState(0)
  const [genreFitScore, setGenreFitScore] = useState(0)
  const [overallScore, setOverallScore] = useState(0)
  const [notes, setNotes] = useState('')
  const [decision, setDecision] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; title: string; description?: string }>({
    open: false,
    title: '',
  })

  const formLocked = !isEligible

  const canSubmit =
    isEligible &&
    productionScore > 0 &&
    genreFitScore > 0 &&
    overallScore > 0 &&
    decision !== null

  async function handleSubmit() {
    if (!canSubmit) return
    setLoading(true)

    try {
      const res = await fetch('/api/curator/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          productionScore,
          genreFitScore,
          overallScore,
          notes: notes.trim() || undefined,
          playlistDecision: decision,
          activeListenTimeMs: displayMs,
          resetsCount: interruptionsCount,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setToast({ open: true, title: data.error ?? 'Submission failed' })
        return
      }

      const { credits, playlistDecision } = await res.json()

      if (playlistDecision) {
        router.push(`/review/add?sessionId=${sessionId}&trackId=${trackId}&credits=${credits}`)
      } else {
        router.push(`/review?submitted=1&credits=${credits}&decision=passed`)
      }
    } catch {
      setToast({ open: true, title: 'Network error — please try again' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Track header */}
      <div className="surface-card flex items-center gap-4 p-5">
        {artworkUrl ? (
          <img
            src={artworkUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="h-16 w-16 shrink-0 rounded-lg bg-white/[0.04]" />
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-white">{trackTitle}</p>
          <p className="text-sm text-white/50">{artistName}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {genres.map((g) => (
              <span
                key={g}
                className="rounded-full border border-white/10 px-2 py-0.5 text-[0.65rem] text-white/40"
              >
                {g}
              </span>
            ))}
            {explicit && (
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[0.65rem] text-white/40">
                E
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Embedded player */}
      <SpotifyEmbed
        trackId={extractSpotifyTrackId(spotifyUrl) ?? ''}
        trackTitle={trackTitle}
        artistName={artistName}
        spotifyUrl={spotifyUrl}
        onPlaybackUpdate={({ isPlaying: playing }) => setIsPlaying(playing)}
      />

      {/* Listen progress — visible until eligible */}
      {!isEligible && (
        <ListenProgressBar currentMs={displayMs} targetSeconds={30} />
      )}

      {/* Review form — locked until 30s listened */}
      <div className={cn('surface-card space-y-6 p-6', formLocked && 'opacity-40')}>
        {formLocked && (
          <p className="text-xs font-medium text-white/50">
            Listen for 30 seconds to unlock your review.
          </p>
        )}

        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">
          Your review
        </p>

        <ScorePicker
          label="Production quality"
          value={productionScore}
          onChange={setProductionScore}
          disabled={formLocked}
        />
        <ScorePicker
          label="Genre fit for your playlist"
          value={genreFitScore}
          onChange={setGenreFitScore}
          disabled={formLocked}
        />
        <ScorePicker
          label="Overall impression"
          value={overallScore}
          onChange={setOverallScore}
          disabled={formLocked}
        />

        <div>
          <label className="mb-2 block text-xs font-medium text-white/50">
            What would you tell this artist?{' '}
            <span className="text-white/25">(optional)</span>
          </label>
          <textarea
            rows={3}
            maxLength={500}
            value={notes}
            disabled={formLocked}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Be specific and constructive. Artists read every word."
            className="w-full resize-none rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white transition focus:border-acid/40 focus:outline-none focus:ring-2 focus:ring-acid/15 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>

      {/* Binary decision — last step */}
      <div className={cn('surface-card p-6', formLocked && 'opacity-40')}>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-white/40">
          Your decision
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={formLocked}
            onClick={() => setDecision(true)}
            className={cn(
              'rounded-xl border p-4 text-left transition',
              formLocked
                ? 'cursor-not-allowed border-white/5'
                : decision === true
                  ? 'border-acid/40 bg-acid/8'
                  : 'border-white/10 hover:border-white/20'
            )}
          >
            <p className={cn('font-bold', !formLocked && decision === true ? 'text-acid' : 'text-white/60')}>
              Add to playlist
            </p>
            <p className="mt-1 text-xs text-white/40">
              Confirm the add in Spotify after submitting.
            </p>
          </button>
          <button
            type="button"
            disabled={formLocked}
            onClick={() => setDecision(false)}
            className={cn(
              'rounded-xl border p-4 text-left transition',
              formLocked
                ? 'cursor-not-allowed border-white/5'
                : decision === false
                  ? 'border-white/30 bg-white/[0.04]'
                  : 'border-white/10 hover:border-white/20'
            )}
          >
            <p className={cn('font-bold', !formLocked && decision === false ? 'text-white' : 'text-white/60')}>
              Not this time
            </p>
            <p className="mt-1 text-xs text-white/40">
              Artist receives your feedback only.
            </p>
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={!canSubmit || loading}
        onClick={handleSubmit}
        className={cn(
          'button-primary w-full',
          (!canSubmit || loading) && 'cursor-not-allowed opacity-50'
        )}
      >
        {loading ? 'Submitting...' : 'Submit review & earn 1 credit'}
      </button>

      <StatusToast
        open={toast.open}
        tone="error"
        title={toast.title}
        description={toast.description}
        onClose={() => setToast((c) => ({ ...c, open: false }))}
      />
    </div>
  )
}
