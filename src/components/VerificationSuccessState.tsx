'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import StartListeningButton from '@/components/StartListeningButton'
import StatusToast from '@/components/StatusToast'
import {
  ArrowUpRightIcon,
  CheckIcon,
  ChevronRightIcon,
  XIcon,
} from '@/components/AppIcons'
import { cn } from '@/lib/cn'

interface VerificationSuccessStateProps {
  verificationId: string
  playlistName: string
  verifiedAt: string | null
  persistenceDueAt: string | null
  newCredits: number | null
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
}

export default function VerificationSuccessState({
  verificationId,
  playlistName,
  verifiedAt,
  persistenceDueAt,
  newCredits,
}: VerificationSuccessStateProps) {
  const [accordionOpen, setAccordionOpen] = useState(false)
  const [downgraded, setDowngraded] = useState(false)
  const [rechecking, setRechecking] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [toast, setToast] = useState<{
    open: boolean
    tone: 'success' | 'error'
    title: string
    description?: string
  }>({
    open: false,
    tone: 'success',
    title: '',
  })

  useEffect(() => {
    if (!accordionOpen || !verifiedAt) {
      return
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [accordionOpen, verifiedAt])

  const recheckReadyAt = useMemo(() => {
    if (persistenceDueAt) {
      return new Date(persistenceDueAt).getTime()
    }

    if (!verifiedAt) {
      return null
    }

    return new Date(verifiedAt).getTime() + 5 * 60_000
  }, [persistenceDueAt, verifiedAt])

  const recheckCountdownMs = recheckReadyAt ? Math.max(0, recheckReadyAt - now) : 0
  const canRecheck = recheckCountdownMs === 0

  async function handleManualRecheck() {
    setRechecking(true)

    try {
      const res = await fetch(
        `/api/playlist/verifications/${verificationId}/recheck`,
        {
          method: 'POST',
        }
      )
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Persistence check failed')
      }

      if (data.quality === 'low_quality' || !data.verified) {
        setDowngraded(true)
        setToast({
          open: true,
          tone: 'error',
          title: 'Verification downgraded',
          description:
            'Spotify no longer shows the track in that playlist, so the add no longer counts.',
        })
        return
      }

      setToast({
        open: true,
        tone: 'success',
        title: 'Verification still holds',
        description:
          'Spotify still shows the track in the selected playlist after the hold window.',
      })
    } catch (error) {
      setToast({
        open: true,
        tone: 'error',
        title: 'Re-check failed',
        description:
          error instanceof Error
            ? error.message
            : 'The persistence check could not be completed.',
      })
    } finally {
      setRechecking(false)
    }
  }

  return (
    <>
      <div className="surface-card animate-fade-in-up p-8 text-center">
        <div
          className={cn(
            'mx-auto flex h-20 w-20 items-center justify-center rounded-full shadow-[0_22px_70px_-35px_rgba(34,197,94,0.95)]',
            downgraded
              ? 'border border-amber-400/20 bg-amber-500/12 text-amber-100 shadow-[0_22px_70px_-35px_rgba(251,191,36,0.75)]'
              : 'border border-brand-400/20 bg-brand-500/12 text-brand-300'
          )}
        >
          {downgraded ? (
            <XIcon className="h-8 w-8" />
          ) : (
            <CheckIcon className="h-8 w-8" />
          )}
        </div>

        <h2 className="mt-6 text-4xl font-semibold tracking-tight text-white">
          {downgraded ? 'Verification downgraded' : 'Verified &amp; Credit Earned'}
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-400">
          {downgraded
            ? `Spotify no longer shows the track in ${playlistName}, so this add no longer counts as verified.`
            : `Track confirmed in ${playlistName}.`}
        </p>

        <div className="mx-auto mt-8 max-w-sm rounded-[1.6rem] border border-white/10 bg-slate-950/75 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            New balance
          </p>
          <p className="mt-3 text-4xl font-semibold text-white">
            {newCredits ?? '—'}
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-sm space-y-3">
          <StartListeningButton label="Listen Another Track" fullWidth />
          <Link href="/dashboard" className="button-ghost gap-1 px-0 py-0">
            Back to dashboard
            <ArrowUpRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mx-auto mt-8 max-w-xl rounded-[1.4rem] border border-white/10 bg-slate-950/65">
          <button
            type="button"
            onClick={() => setAccordionOpen((current) => !current)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            aria-expanded={accordionOpen}
          >
            <div>
              <p className="text-sm font-medium text-white">What happens next?</p>
              <p className="mt-1 text-sm text-slate-400">
                SoundSwap runs the five-minute hold check quietly in the background.
              </p>
            </div>
            <ChevronRightIcon
              className={cn(
                'h-4 w-4 text-slate-400 transition-transform',
                accordionOpen && 'rotate-90'
              )}
            />
          </button>

          {accordionOpen && (
            <div className="border-t border-white/10 px-5 py-4 text-left">
              <p className="text-sm leading-6 text-slate-400">
                Most verified adds need no further action. If you want to test the
                persistence check manually, the fallback button unlocks after the
                hold window.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {canRecheck
                    ? 'Manual re-check is ready'
                    : `Manual re-check unlocks in ${formatCountdown(recheckCountdownMs)}`}
                </p>
                <button
                  type="button"
                  onClick={handleManualRecheck}
                  disabled={!canRecheck || rechecking}
                  className="button-secondary disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {rechecking ? 'Checking...' : 'Manual Re-check'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <StatusToast
        open={toast.open}
        tone={toast.tone}
        title={toast.title}
        description={toast.description}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />
    </>
  )
}
