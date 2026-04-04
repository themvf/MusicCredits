import { Suspense } from 'react'
import Link from 'next/link'
import ListenPageClient from '@/components/ListenPageClient'
import PageHeader from '@/components/PageHeader'
import StartListeningButton from '@/components/StartListeningButton'
import { BoltIcon, HeadphonesIcon, ShieldIcon } from '@/components/AppIcons'

export default async function ListenPage({
  searchParams,
}: {
  searchParams: Promise<{ trackId?: string; sessionId?: string }>
}) {
  const { trackId, sessionId } = await searchParams

  if (!trackId || !sessionId) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Listen & Earn"
          title="Start a queued session"
          description="Jump into the next verified track, listen for 30 focused seconds, and collect a credit when the rating unlocks."
          actions={<StartListeningButton label="Find a track" />}
        />

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="surface-card p-7">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="surface-card-soft p-5">
                <HeadphonesIcon className="h-5 w-5 text-brand-300" />
                <p className="mt-4 text-sm font-semibold text-white">
                  30 focused seconds
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Keep Spotify playing continuously to unlock the next step.
                </p>
              </div>
              <div className="surface-card-soft p-5">
                <ShieldIcon className="h-5 w-5 text-brand-300" />
                <p className="mt-4 text-sm font-semibold text-white">
                  Anti-skip session rules
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Pauses, tab switches, and forward seeks reset the timer.
                </p>
              </div>
              <div className="surface-card-soft p-5">
                <BoltIcon className="h-5 w-5 text-brand-300" />
                <p className="mt-4 text-sm font-semibold text-white">
                  +1 verified credit
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Rate the track once listening is complete and collect the reward.
                </p>
              </div>
            </div>
          </div>

          <div className="surface-card p-7">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
              Need more promotion balance?
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              Listening is the growth engine
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-400">
              Every completed session puts you back in control of the next
              campaign. Open a queued track whenever you need to rebuild balance.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <StartListeningButton label="Start a session" />
              <Link href="/dashboard" className="button-secondary">
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="surface-card p-8 text-sm text-slate-400">
          Loading the listening session...
        </div>
      }
    >
      <ListenPageClient trackId={trackId} sessionId={sessionId} />
    </Suspense>
  )
}
