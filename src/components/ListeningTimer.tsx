'use client'

interface Props {
  started: boolean
  displayMs: number
  isEligible: boolean
  onStart: () => void
}

const REQUIRED_MS = 30_000

/**
 * Displays a progress bar and elapsed / required time.
 *
 * Before the user starts: shows a "I'm playing — start timer" button.
 * After starting: shows the live countdown progress.
 */
export default function ListeningTimer({ started, displayMs, isEligible, onStart }: Props) {
  const seconds = Math.floor(displayMs / 1000)
  const cappedSeconds = Math.min(seconds, 30)
  const progressPct = Math.min((displayMs / REQUIRED_MS) * 100, 100)

  // Pre-start state: prompt the user to press play first
  if (!started) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
        <p className="text-sm text-gray-400">
          Press <span className="text-white font-semibold">play</span> in the player above, then click the button below to start your 30-second timer.
        </p>
        <button
          onClick={onStart}
          className="w-full py-2.5 bg-green-500 hover:bg-green-400 text-black font-semibold text-sm rounded-xl transition-colors"
        >
          I&apos;m playing — start timer
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-400">
          {isEligible ? 'Ready to rate!' : `Listening... ${cappedSeconds}s / 30s`}
        </span>
        {isEligible ? (
          <span className="text-green-400 text-sm font-semibold">✓ Threshold reached</span>
        ) : (
          <span className="text-gray-500 text-xs">Tab must stay visible</span>
        )}
      </div>

      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isEligible ? 'bg-green-500' : 'bg-green-700'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {!isEligible && (
        <p className="mt-3 text-xs text-gray-500">
          Keep this tab open and listen to accumulate time. Switching tabs pauses the timer.
        </p>
      )}
    </div>
  )
}
