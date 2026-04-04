'use client'

interface ListenProgressBarProps {
  currentMs: number
  targetSeconds?: number
}

export default function ListenProgressBar({
  currentMs,
  targetSeconds = 30,
}: ListenProgressBarProps) {
  const listenedSeconds = Math.min(Math.floor(currentMs / 1000), targetSeconds)
  const progress = Math.min((currentMs / (targetSeconds * 1000)) * 100, 100)

  return (
    <div className="surface-card-soft p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white">Listening progress</p>
        <span className="text-sm font-medium text-slate-300">
          {listenedSeconds}s / {targetSeconds}s listened
        </span>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-950/85">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#1d63ed,#1ed760)] transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
