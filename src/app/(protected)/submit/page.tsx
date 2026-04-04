import PageHeader from '@/components/PageHeader'
import SubmitTrackForm from '@/components/SubmitTrackForm'
import StatCard from '@/components/StatCard'
import { BoltIcon, UploadIcon, WaveformIcon } from '@/components/AppIcons'
import { getAuthenticatedUser } from '@/lib/auth'

export default async function SubmitPage() {
  const user = await getAuthenticatedUser()

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Submit Track"
        title="Queue your next release"
        description="Paste a Spotify track URL, review the preview card, and spend credits to put the song in front of active listeners."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Credits Available"
          value={user.credits}
          sub="Ready to spend right now"
          icon={<BoltIcon className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Submission Cost"
          value={10}
          sub="Fixed per queued track"
          icon={<UploadIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Campaign Model"
          value="Fair"
          sub="Growth is funded by listening, not ad spend"
          icon={<WaveformIcon className="h-5 w-5" />}
        />
      </div>

      <SubmitTrackForm credits={user.credits} />
    </div>
  )
}
