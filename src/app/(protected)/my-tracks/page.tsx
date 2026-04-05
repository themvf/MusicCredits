import Link from 'next/link'
import MyTracksTable from '@/components/MyTracksTable'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import { ArrowUpRightIcon, SparkIcon, UploadIcon, WaveformIcon } from '@/components/AppIcons'
import { getAuthenticatedUser } from '@/lib/auth'
import { getCreatorAnalytics } from '@/lib/creator-analytics'

export default async function MyTracksPage() {
  const user = await getAuthenticatedUser()
  const { enrichedTracks, summary } = await getCreatorAnalytics(user.id)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="My Tracks"
        title="Monitor your submissions"
        description="Review every queued release, remove underperforming tracks, and keep your catalog fresh."
        actions={
          <Link href="/submit" className="button-primary">
            <UploadIcon className="h-4 w-4" />
            Queue another track
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Tracks Submitted"
          value={summary.tracksSubmitted}
          sub="Total campaigns launched"
          icon={<UploadIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Total Listens"
          value={summary.totalListens}
          sub="Verified listens received"
          icon={<WaveformIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Average Rating"
          value={summary.averageRating}
          sub="Across tracks with feedback"
          icon={<SparkIcon className="h-5 w-5" />}
          tone="brand"
        />
      </div>

      <div className="surface-card p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Track roster</h2>
            <p className="mt-1 text-sm text-slate-400">
              Every queued release, its current performance, and confirmed
              playlist destinations.
            </p>
          </div>
          <Link href="/earnings" className="button-ghost gap-1 px-0 py-0">
            View credit performance
            <ArrowUpRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        <MyTracksTable tracks={enrichedTracks} />
      </div>
    </div>
  )
}
