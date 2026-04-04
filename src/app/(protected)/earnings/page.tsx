import ActivityFeed from '@/components/ActivityFeed'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import { BoltIcon, HeadphonesIcon, UploadIcon, WalletIcon } from '@/components/AppIcons'
import { getAuthenticatedUser } from '@/lib/auth'
import { getCreatorAnalytics } from '@/lib/creator-analytics'

export default async function EarningsPage() {
  const user = await getAuthenticatedUser()
  const { activity, creditsTrend, summary } = await getCreatorAnalytics(user.id)

  const netCredits = summary.creditsEarned - summary.creditsSpent

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Earnings"
        title="Understand your credit economics"
        description="See how listening converts into balance, how submissions spend it down, and when your creator engine is at peak efficiency."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard
          label="Current Credits"
          value={user.credits}
          sub="Balance available now"
          icon={<WalletIcon className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Earned"
          value={summary.creditsEarned}
          sub="Credits from completed listens"
          icon={<BoltIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Spent"
          value={summary.creditsSpent}
          sub="Credits invested in submissions"
          icon={<UploadIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Net Flow"
          value={netCredits}
          sub="Earned minus spent"
          icon={<HeadphonesIcon className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="surface-card p-6">
          <p className="text-lg font-semibold text-white">Seven-day flow</p>
          <p className="mt-1 text-sm text-slate-400">
            Green bars show earned credits, blue bars show spending.
          </p>

          <div className="mt-8 grid h-56 grid-cols-7 items-end gap-3">
            {creditsTrend.map((point) => {
              const maxValue = Math.max(
                ...creditsTrend.map((entry) => Math.max(entry.earned, entry.spent, 1))
              )

              return (
                <div key={point.label} className="flex flex-col items-center gap-3">
                  <div className="flex h-44 w-full items-end justify-center gap-1">
                    <span
                      className="w-4 rounded-full bg-[linear-gradient(180deg,rgba(34,197,94,0.92),rgba(34,197,94,0.2))]"
                      style={{ height: `${Math.max((point.earned / maxValue) * 100, 8)}%` }}
                    />
                    <span
                      className="w-4 rounded-full bg-[linear-gradient(180deg,rgba(59,130,246,0.82),rgba(59,130,246,0.18))]"
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

        <ActivityFeed items={activity} />
      </div>
    </div>
  )
}
