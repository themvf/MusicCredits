'use client'

import { CheckIcon, ClockIcon, PlayIcon } from '@/components/AppIcons'

interface ListeningTimerProps {
  isPlaying: boolean
  displayMs: number
  isEligible: boolean
  addToPlaylistUrl?: string | null
  onAdvance?: () => void
}

const REQUIRED_MS = 30_000

export default function ListeningTimer({
  isPlaying,
  displayMs,
  isEligible,
  addToPlaylistUrl,
  onAdvance,
}: ListeningTimerProps) {
  const elapsedSeconds = Math.min(Math.floor(displayMs / 1000), 30)
  const progressPct = Math.min((displayMs / REQUIRED_MS) * 100, 100)
  const hasStarted = displayMs > 0 || isPlaying

  return (
    <div className="surface-card p-6">
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr] xl:items-end">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-slate-500">
            <ClockIcon className="h-3.5 w-3.5" />
            30-second timer
          </div>

          <div>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-semibold tracking-tight text-white">
                {elapsedSeconds}
              </span>
              <span className="pb-1 text-sm uppercase tracking-[0.18em] text-slate-500">
                / 30 sec
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Stay on this tab and let Spotify play until you reach 30 total seconds.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.18em] ${
                isEligible
                  ? 'border border-brand-400/20 bg-brand-500/12 text-brand-300'
                  : isPlaying
                    ? 'border border-sky-400/20 bg-sky-500/10 text-sky-200'
                    : 'border border-amber-300/20 bg-amber-400/10 text-amber-200'
              }`}
            >
              {isEligible ? (
                <CheckIcon className="h-3.5 w-3.5" />
              ) : (
                <PlayIcon className="h-3.5 w-3.5" />
              )}
              {isEligible ? 'Unlocked' : isPlaying ? 'Listening' : 'Paused'}
            </span>
            <span className="text-sm text-slate-400">
              {hasStarted
                ? isEligible
                  ? 'Next step is ready.'
                  : isPlaying
                    ? 'Progress counts while audio is playing.'
                    : 'Progress is paused until playback resumes.'
                : 'Press play on the Spotify embed to begin.'}
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-950/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isEligible
                  ? 'bg-[linear-gradient(90deg,rgba(34,197,94,1),rgba(59,130,246,0.65))]'
                  : 'bg-[linear-gradient(90deg,rgba(59,130,246,0.9),rgba(34,197,94,0.45))]'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-slate-400">
              Scrubbing is allowed. Only your total active play time must reach 30 seconds.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {addToPlaylistUrl ? (
                isEligible ? (
                  <a
                    href={addToPlaylistUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="button-primary justify-center"
                  >
                    Add to Playlist
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="button-primary justify-center disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add to Playlist
                  </button>
                )
              ) : null}
              <button
                type="button"
                onClick={onAdvance}
                disabled={!isEligible}
                className="button-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
