'use client'

interface Props {
  isPlaying: boolean
  displayMs: number
  isEligible: boolean
}

const REQUIRED_MS = 30_000

/**
 * Displays playback state and listening progress.
 *
 * Three visual states:
 *   1. Not yet playing   — prompt to press play
 *   2. Playing/paused    — live progress bar
 *   3. Eligible          — ready to rate
 */
export default function ListeningTimer({ isPlaying, displayMs, isEligible }: Props) {
  const seconds = Math.floor(displayMs / 1000)
  const cappedSeconds = Math.min(seconds, 30)
  const progressPct = Math.min((displayMs / REQUIRED_MS) * 100, 100)
  const hasStarted = displayMs > 0 || isPlaying

  if (!hasStarted) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-sm text-gray-400 text-center">
          Press <span className="text-white font-semibold">▶ play</span> in the player above to start your 30-second timer.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-400">
          {isEligible
            ? 'Ready to rate!'
            : isPlaying
            ? `Listening... ${cappedSeconds}s / 30s`
            : `Paused — ${cappedSeconds}s / 30s`}
        </span>
        <span className={`text-xs font-semibold ${
          isEligible ? 'text-green-400' : isPlaying ? 'text-green-500' : 'text-yellow-500'
        }`}>
          {isEligible ? '✓ Threshold reached' : isPlaying ? '● Playing' : '⏸ Paused'}
        </span>
      </div>

      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isEligible ? 'bg-green-500' : isPlaying ? 'bg-green-600' : 'bg-yellow-600'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {!isEligible && (
        <p className="mt-3 text-xs text-gray-500">
          {isPlaying
            ? 'Timer only runs while audio is playing and this tab is visible.'
            : 'Resume playback to continue accumulating listening time.'}
        </p>
      )}
    </div>
  )
}
