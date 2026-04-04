'use client'

import { useState } from 'react'
import { HeadphonesIcon, InfoIcon } from '@/components/AppIcons'
import { cn } from '@/lib/cn'

const tooltipCopy =
  'Your Spotify playback is linked to the SoundSwap timer. Play here to earn progress.'

export default function SyncedSessionBadge() {
  const [open, setOpen] = useState(false)

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-slate-500"
        aria-expanded={open}
        aria-label="Explain synced session"
      >
        <HeadphonesIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Synced session</span>
        <InfoIcon className="h-3.5 w-3.5 text-slate-400" />
      </button>

      <div
        role="tooltip"
        className={cn(
          'pointer-events-none absolute right-0 top-full z-10 mt-3 w-64 rounded-2xl border border-white/10 bg-slate-950/95 p-3 text-left text-xs leading-6 text-slate-300 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.95)] transition duration-150 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100',
          open
            ? 'pointer-events-auto opacity-100'
            : 'opacity-0 lg:pointer-events-none'
        )}
      >
        {tooltipCopy}
      </div>
    </div>
  )
}
