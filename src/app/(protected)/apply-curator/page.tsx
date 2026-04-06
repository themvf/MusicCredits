import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PageHeader from '@/components/PageHeader'
import CuratorApplicationForm from '@/components/CuratorApplicationForm'

export default async function ApplyCuratorPage() {
  const user = await getAuthenticatedUser()

  if (user.role === 'admin') redirect('/dashboard')

  const [latestApplication, spotifyAccount] = await Promise.all([
    prisma.curatorApplication.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        status: true,
        rejectionReason: true,
        reviewedBy: true,
        createdAt: true,
      },
    }),
    prisma.spotifyAccount.findUnique({
      where: { userId: user.id },
      select: { id: true },
    }),
  ])

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader
        eyebrow="Curator programme"
        title="Become a curator"
        description="Apply to review tracks, give structured feedback, and earn on SoundSwap. Requires a public Spotify playlist with a real audience."
      />

      <CuratorApplicationForm
        spotifyConnected={!!spotifyAccount}
        existingApplication={
          latestApplication
            ? {
                status: latestApplication.status as 'pending' | 'approved' | 'rejected',
                appliedAt: latestApplication.createdAt.toISOString(),
                rejectionReason: latestApplication.rejectionReason,
                reviewedBy: latestApplication.reviewedBy,
              }
            : null
        }
      />
    </div>
  )
}
