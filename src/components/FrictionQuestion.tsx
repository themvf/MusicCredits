'use client'

import {
  BoltIcon,
  HeadphonesIcon,
  SparkIcon,
  StarIcon,
  WaveformIcon,
} from '@/components/AppIcons'

const vibeOptions = [
  { value: 'energetic', label: 'Energetic', icon: BoltIcon },
  { value: 'chill', label: 'Chill', icon: HeadphonesIcon },
  { value: 'emotional', label: 'Emotional', icon: SparkIcon },
  { value: 'hype', label: 'Hype', icon: StarIcon },
  { value: 'unique', label: 'Unique', icon: WaveformIcon },
] as const

interface FrictionQuestionProps {
  onSelect: (vibe: string) => void
}

export default function FrictionQuestion({
  onSelect,
}: FrictionQuestionProps) {
  return (
    <div className="surface-card p-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
          Quick check
        </p>
        <h3 className="text-2xl font-semibold text-white">
          What is the vibe of this track?
        </h3>
        <p className="text-sm leading-6 text-slate-400">
          One quick answer keeps the session intentional before feedback unlocks.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {vibeOptions.map((option) => {
          const Icon = option.icon

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-brand-400/20 hover:bg-brand-500/10"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand-300 transition group-hover:border-brand-400/20 group-hover:bg-brand-500/12">
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-medium text-white">
                  {option.label}
                </span>
                <span className="block text-xs uppercase tracking-[0.16em] text-slate-500">
                  Select vibe
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
