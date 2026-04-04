'use client'

import { useState } from 'react'
import StatusToast from '@/components/StatusToast'
import {
  BoltIcon,
  HeadphonesIcon,
  SparkIcon,
  StarIcon,
  WaveformIcon,
} from '@/components/AppIcons'
import { cn } from '@/lib/cn'
import { useSessionFlow } from '@/hooks/useSessionFlow'

const vibeOptions = [
  { value: 'energetic', label: 'Energetic', icon: BoltIcon },
  { value: 'chill', label: 'Chill', icon: HeadphonesIcon },
  { value: 'emotional', label: 'Emotional', icon: SparkIcon },
  { value: 'hype', label: 'Hype', icon: StarIcon },
  { value: 'unique', label: 'Unique', icon: WaveformIcon },
] as const

interface FeedbackPanelProps {
  sessionId: string
  accumulatedMs: number
  resetsCount: number
  onSuccess: (credits: number) => void
}

const ratingLabels = ['Skip', 'Okay', 'Solid', 'Strong', 'Replay'] as const

export default function FeedbackPanel({
  sessionId,
  accumulatedMs,
  resetsCount,
  onSuccess,
}: FeedbackPanelProps) {
  const { markFeedbackSubmitted } = useSessionFlow()
  const [hoveredStar, setHoveredStar] = useState(0)
  const [selectedStar, setSelectedStar] = useState(0)
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null)
  const [timeToVibeMs, setTimeToVibeMs] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [unlockAt] = useState(() => Date.now())
  const [toast, setToast] = useState<{
    open: boolean
    title: string
    description?: string
  }>({
    open: false,
    title: '',
  })

  const canSubmit = selectedStar > 0 && Boolean(selectedVibe) && !loading
  const activeLabel =
    selectedStar === 0
      ? 'Choose a rating to finish the session.'
      : ratingLabels[selectedStar - 1]

  function handleVibeSelect(vibe: string) {
    setSelectedVibe(vibe)
    if (timeToVibeMs === null) {
      setTimeToVibeMs(Date.now() - unlockAt)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit || !selectedVibe) return

    setLoading(true)

    try {
      const res = await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          score: selectedStar,
          activeListenTimeMs: accumulatedMs,
          vibe: selectedVibe,
          resetsCount,
          timeToVibeMs,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setToast({
          open: true,
          title:
            res.status === 422
              ? 'Keep listening'
              : res.status === 409
                ? 'Session already completed'
                : 'Could not submit feedback',
          description:
            data.error ??
            'Please refresh the session and try the feedback step again.',
        })
        setLoading(false)
        return
      }

      onSuccess(data.credits)
      markFeedbackSubmitted()
    } catch {
      setToast({
        open: true,
        title: 'Network error',
        description: 'Your connection dropped before feedback could be sent.',
      })
      setLoading(false)
    }
  }

  return (
    <>
      <div className="surface-card animate-fade-in-up p-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
            Quick check
          </p>
          <h3 className="text-2xl font-semibold text-white">
            What is the vibe of this track?
          </h3>
          <p className="text-sm leading-6 text-slate-400">
            Pick one vibe and leave a rating to unlock the playlist step.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="flex flex-wrap gap-2.5">
            {vibeOptions.map((option) => {
              const Icon = option.icon
              const selected = selectedVibe === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleVibeSelect(option.value)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition',
                    selected
                      ? 'border-brand-400/45 bg-brand-500/10 text-brand-200'
                      : 'border-[#2a2d35] bg-[#161b22] text-slate-300 hover:border-white/15 hover:bg-white/[0.06]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              )
            })}
          </div>

          <div className="rounded-[1.4rem] border border-white/10 bg-slate-950/72 p-4">
            <p className="text-sm font-medium text-white">Rate the track</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: 5 }, (_, index) => {
                const star = index + 1
                const active = star <= (hoveredStar || selectedStar)

                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setSelectedStar(star)}
                    className={cn(
                      'rounded-2xl border px-3 py-3 transition duration-200',
                      active
                        ? 'border-brand-400/25 bg-brand-500/12 text-white shadow-[0_18px_45px_-32px_rgba(34,197,94,0.95)]'
                        : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/15 hover:bg-white/[0.05]'
                    )}
                    aria-label={`Rate ${star} stars`}
                  >
                    <StarIcon
                      className={cn(
                        'h-5 w-5',
                        active ? 'text-amber-300' : 'text-slate-600'
                      )}
                    />
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">{activeLabel}</p>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading ? (
              <>
                <SparkIcon className="h-4 w-4" />
                Submitting feedback...
              </>
            ) : (
              'Submit Feedback & Continue'
            )}
          </button>
        </form>
      </div>

      <StatusToast
        open={toast.open}
        tone="error"
        title={toast.title}
        description={toast.description}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />
    </>
  )
}
