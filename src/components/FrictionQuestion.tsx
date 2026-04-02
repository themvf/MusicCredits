'use client'

/**
 * Lightweight vibe question shown after the 30s threshold is reached,
 * before the rating form unlocks.
 *
 * Purpose: Soft anti-gaming friction. Bots and inattentive users can't
 * answer this without having actually listened. Answering forces cognitive
 * engagement with the track before submitting a rating.
 *
 * The selected vibe is stored in the Rating record for future
 * recommendation/reputation features.
 */

const VIBE_OPTIONS = [
  { value: 'energetic', label: '⚡ Energetic' },
  { value: 'chill',     label: '😌 Chill' },
  { value: 'emotional', label: '💭 Emotional' },
  { value: 'hype',      label: '🔥 Hype' },
  { value: 'unique',    label: '🎲 Unique' },
]

interface Props {
  onSelect: (vibe: string) => void
}

export default function FrictionQuestion({ onSelect }: Props) {
  return (
    <div className="bg-gray-900 border border-green-800 rounded-xl p-5 flex flex-col gap-4">
      <div>
        <p className="text-white font-semibold text-sm">
          Almost there — one quick question before you rate:
        </p>
        <p className="text-gray-400 text-sm mt-1">
          What&apos;s the vibe of this track?
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {VIBE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className="py-2.5 px-3 bg-gray-800 hover:bg-green-900 hover:border-green-600 border border-gray-700 rounded-xl text-sm text-gray-300 hover:text-white transition-all text-left"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
