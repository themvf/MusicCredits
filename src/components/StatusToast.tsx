'use client'

import { useEffect } from 'react'
import { CheckIcon, SparkIcon, XIcon } from '@/components/AppIcons'
import { cn } from '@/lib/cn'

type ToastTone = 'success' | 'error' | 'info'

interface StatusToastProps {
  open: boolean
  tone: ToastTone
  title: string
  description?: string
  onClose: () => void
  autoCloseMs?: number
}

const toneClasses: Record<ToastTone, string> = {
  success:
    'border-brand-400/25 bg-[linear-gradient(135deg,rgba(34,197,94,0.2),rgba(15,23,42,0.94))] text-brand-50',
  error:
    'border-rose-400/25 bg-[linear-gradient(135deg,rgba(244,63,94,0.18),rgba(15,23,42,0.94))] text-rose-50',
  info:
    'border-sky-400/20 bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(15,23,42,0.94))] text-slate-50',
}

export default function StatusToast({
  open,
  tone,
  title,
  description,
  onClose,
  autoCloseMs = 4000,
}: StatusToastProps) {
  useEffect(() => {
    if (!open) return
    const timeoutId = window.setTimeout(onClose, autoCloseMs)
    return () => window.clearTimeout(timeoutId)
  }, [autoCloseMs, onClose, open])

  if (!open) return null

  const Icon = tone === 'success' ? CheckIcon : SparkIcon

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] w-[min(92vw,24rem)]">
      <div
        className={cn(
          'pointer-events-auto overflow-hidden rounded-[1.4rem] border shadow-[0_35px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur-2xl',
          toneClasses[tone]
        )}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
        <div className="flex items-start gap-4 p-4">
          <div className="mt-0.5 rounded-2xl border border-white/10 bg-white/10 p-2">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-semibold text-white">{title}</p>
            {description && (
              <p className="text-sm leading-6 text-slate-300">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Dismiss notification"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
