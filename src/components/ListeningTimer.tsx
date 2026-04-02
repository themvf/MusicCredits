'use client'

interface Props {
  isPlaying: boolean
  displayMs: number
  isEligible: boolean
}

const REQUIRED_MS = 30_000

/**
 * Displays real-time listening progress.
 *
 * Key behavior: the progress bar resets to 0 on pause, tab switch, or seek.
 * This visually reinforces that 30 CONTINUOUS seconds are required.
 *
 * States:
 *   - Not yet playing:   prompt to press play
 *   - Playing:           live green progress bar
 *   - Paused mid-listen: yellow bar, "Paused — progress reset" warning
 *   - Eligible:          full green bar, ready for vibe question + rating
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
        <span className="text-sm font-medium text-gray-300">
          {isEligible
            ? '✓ 30 seconds reached'
            : isPlaying
            ? `Listening... ${cappedSeconds}s / 30s`
            : `Paused — ${cappedSeconds}s / 30s`}
        </span>
        <span className={`text-xs font-semibold ${
          isEligible ? 'text-green-400' : isPlaying ? 'text-green-500' : 'text-yellow-500'
        }`}>
          {isEligible ? '🎧 Ready' : isPlaying ? '● Playing' : '⏸ Paused'}
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

      {!isEligible && !isPlaying && (
        <p className="mt-2 text-xs text-yellow-600">
          Progress resets on pause or tab switch — resume to continue.
        </p>
      )}

      {!isEligible && isPlaying && (
        <p className="mt-2 text-xs text-gray-500">
          Keep playing without pausing or switching tabs.
        </p>
      )}
    </div>
  )
}
