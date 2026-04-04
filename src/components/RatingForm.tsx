'use client'

import { useState } from 'react'
import { CheckIcon, SparkIcon } from '@/components/AppIcons'
import StatusToast from '@/components/StatusToast'
import { cn } from '@/lib/cn'

interface RatingFormProps {
  sessionId: string
  isEligible: boolean
  accumulatedMs: number
  vibe: string
  resetsCount: number
  timeToVibeMs: number | null
  onSuccess: (newCredits: number) => void
}

const ratingLabels = ['Skip', 'Okay', 'Solid', 'Strong', 'Replay'] as const

export default function RatingForm({
  sessionId,
  isEligible,
  accumulatedMs,
  vibe,
  resetsCount,
  timeToVibeMs,
  onSuccess,
}: RatingFormProps) {
  const [hoveredStar, setHoveredStar] = useState(0)
  const [selectedStar, setSelectedStar] = useState(0)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{
    open: boolean
    title: string
    description?: string
  }>({
    open: false,
    title: '',
  })

  const locked = !isEligible
  const activeLabel =
    selectedStar === 0
      ? 'Choose a rating to finish the session.'
      : ratingLabels[selectedStar - 1]

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (locked || selectedStar === 0 || loading) return

    setLoading(true)

    try {
      const res = await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          score: selectedStar,
          activeListenTimeMs: accumulatedMs,
          vibe,
          resetsCount,
          timeToVibeMs,
        }),
      })

      if (res.status === 422) {
        setToast({
          open: true,
          title: 'Keep listening',
          description: 'The 30-second timer must finish before rating unlocks.',
        })
        setLoading(false)
        return
      }

      if (res.status === 409) {
        setToast({
          open: true,
          title: 'Session already rated',
          description: 'This listening session was already completed.',
        })
        setLoading(false)
        return
      }

      if (!res.ok) {
        setToast({
          open: true,
          title: 'Could not submit rating',
          description: 'Please try again once the session refreshes.',
        })
        setLoading(false)
        return
      }

      const data = await res.json()
      onSuccess(data.credits)
    } catch {
      setToast({
        open: true,
        title: 'Network error',
        description: 'Your connection dropped before the rating could be sent.',
      })
      setLoading(false)
    }
  }

  return (
    <>
      <div
        className={cn(
          'surface-card p-6 transition',
          locked && 'pointer-events-none opacity-55'
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
              Rate the track
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              Lock in your feedback
            </h3>
          </div>
          <span className="rounded-full border border-brand-400/15 bg-brand-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-brand-300">
            +1 credit
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }, (_, index) => {
              const star = index + 1
              const active = star <= (hoveredStar || selectedStar)

              return (
                <button
                  key={star}
                  type="button"
                  disabled={locked}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setSelectedStar(star)}
                  className={cn(
                    'rounded-2xl border px-3 py-4 transition duration-200',
                    active
                      ? 'border-brand-400/25 bg-brand-500/12 text-white shadow-[0_18px_45px_-32px_rgba(34,197,94,0.95)]'
                      : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/15 hover:bg-white/[0.05]'
                  )}
                  aria-label={`Rate ${star} stars`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className={cn(
                        'h-7 w-7',
                        active ? 'text-amber-300' : 'text-slate-600'
                      )}
                    >
                      <path
                        d="m12 3 2.7 5.6 6.2.9-4.5 4.4 1 6.1-5.4-2.9-5.6 2.9 1.1-6.1L3 9.5l6.3-.9L12 3Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="text-xs uppercase tracking-[0.16em]">
                      {star}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="rounded-[1.3rem] border border-white/10 bg-slate-950/65 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <CheckIcon className="h-4 w-4 text-brand-300" />
              {activeLabel}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Your rating pairs with the vibe tag and session integrity data to
              keep feedback useful for creators.
            </p>
          </div>

          <button
            type="submit"
            disabled={locked || selectedStar === 0 || loading}
            className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading ? (
              <>
                <SparkIcon className="h-4 w-4" />
                Submitting rating...
              </>
            ) : (
              'Submit Rating'
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
