import Link from 'next/link'
import ActivityFeed from '@/components/ActivityFeed'
import ListeningHistory from '@/components/ListeningHistory'
import MyTracksTable from '@/components/MyTracksTable'
import PageHeader from '@/components/PageHeader'
import StartListeningButton from '@/components/StartListeningButton'
import StatCard from '@/components/StatCard'
import {
  ActivityIcon,
  BoltIcon,
  HeadphonesIcon,
  SparkIcon,
  UploadIcon,
  WalletIcon,
} from '@/components/AppIcons'
import { getAuthenticatedUser } from '@/lib/auth'
import { getCreatorAnalytics } from '@/lib/creator-analytics'

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()
  const { enrichedTracks, historyEntries, activity, creditsTrend, summary } =
    await getCreatorAnalytics(user.id)

  const bestDay =
    creditsTrend.reduce((best, current) =>
      current.earned > best.earned ? current : best
    ) ?? { label: 'Today', earned: 0, spent: 0 }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard"
        title="Run your creator loop"
        description="Track credit momentum, queue songs, and keep your discovery engine moving."
        actions={
          <>
            <StartListeningButton label="Listen & Earn" />
            <Link href="/submit" className="button-secondary">
              <UploadIcon className="h-4 w-4" />
              Submit Track
            </Link>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="surface-card p-7">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <span className="eyebrow-badge">
                <WalletIcon className="h-4 w-4" />
                Available balance
              </span>
              <div>
                <p className="metric-value">{user.credits}</p>
                <p className="mt-2 max-w-xl text-base leading-7 text-slate-400">
                  Every completed listen adds one credit. Every new submission
                  spends ten to enter the queue.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="surface-card-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Earned
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {summary.creditsEarned}
                </p>
              </div>
              <div className="surface-card-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Spent
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {summary.creditsSpent}
                </p>
              </div>
              <div className="surface-card-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Best day
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {bestDay.earned}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                  {bestDay.label}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Weekly credit flow</p>
              <p className="mt-1 text-sm text-slate-400">
                Earned versus spent across the last seven days.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-500">
              7 days
            </span>
          </div>

          <div className="mt-8 grid h-48 grid-cols-7 items-end gap-3">
            {creditsTrend.map((point) => {
              const maxValue = Math.max(
                ...creditsTrend.map((entry) => Math.max(entry.earned, entry.spent, 1))
              )

              return (
                <div key={point.label} className="flex flex-col items-center gap-3">
                  <div className="flex h-36 w-full items-end justify-center gap-1">
                    <span
                      className="w-3 rounded-full bg-[linear-gradient(180deg,rgba(34,197,94,0.9),rgba(34,197,94,0.25))]"
                      style={{ height: `${Math.max((point.earned / maxValue) * 100, 8)}%` }}
                    />
                    <span
                      className="w-3 rounded-full bg-[linear-gradient(180deg,rgba(59,130,246,0.8),rgba(59,130,246,0.2))]"
                      style={{ height: `${Math.max((point.spent / maxValue) * 100, 8)}%` }}
                    />
                  </div>
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    {point.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard
          label="Tracks Submitted"
          value={summary.tracksSubmitted}
          sub="Campaigns currently created"
          icon={<UploadIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Credits Earned"
          value={summary.creditsEarned}
          sub="Completed listening sessions"
          icon={<BoltIcon className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Completion Rate"
          value={`${summary.completionRate}%`}
          sub="Tracks that have received listens"
          icon={<HeadphonesIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Avg Rating"
          value={summary.averageRating}
          sub="Average score across track feedback"
          icon={<SparkIcon className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ActivityFeed items={activity} />

        <div className="surface-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-white">Momentum snapshot</p>
              <p className="mt-1 text-sm text-slate-400">
                Quick context before you queue the next track.
              </p>
            </div>
            <ActivityIcon className="h-5 w-5 text-brand-300" />
          </div>

          <div className="mt-6 grid gap-4">
            <div className="surface-card-soft p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Total listens received
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {summary.totalListens}
              </p>
            </div>
            <div className="surface-card-soft p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Queue health
              </p>
              <p className="mt-3 text-base leading-7 text-slate-400">
                {summary.tracksSubmitted > 0
                  ? `${summary.completionRate}% of your submissions have already earned feedback.`
                  : 'Submit your first track to start measuring real attention.'}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/my-tracks" className="button-secondary w-full">
                View my tracks
              </Link>
              <Link href="/earnings" className="button-secondary w-full">
                Open earnings
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">My tracks</h2>
            <p className="mt-1 text-sm text-slate-400">
              Watch your submissions move through the exchange.
            </p>
          </div>
          <MyTracksTable tracks={enrichedTracks} />
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Listening history</h2>
            <p className="mt-1 text-sm text-slate-400">
              Your completed sessions and ratings, all in one place.
            </p>
          </div>
          <ListeningHistory sessions={historyEntries} />
        </div>
      </div>
    </div>
  )
}
