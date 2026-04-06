import Link from 'next/link'
import { prisma } from '@/lib/prisma'

interface Props {
  userId: string
}

export default async function CuratorApplicationCard({ userId }: Props) {
  const application = await prisma.curatorApplication.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      status: true,
      rejectionReason: true,
      reviewedBy: true,
      createdAt: true,
      followerCountAtApply: true,
    },
  })

  // Show application status card
  if (application) {
    if (application.status === 'approved') {
      return null // Curator is active — no card needed
    }

    if (application.status === 'pending') {
      return (
        <div className="surface-card p-5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-acid">
            Curator application
          </p>
          <p className="mt-1 text-sm font-medium text-white">Under review</p>
          <p className="mt-1 text-xs text-white/40">
            Submitted{' '}
            {application.createdAt.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
            {' '}· We&apos;ll email you when a decision is made.
          </p>
        </div>
      )
    }

    if (application.status === 'rejected') {
      const isAutoRejection = !application.reviewedBy
      const cooldownActive =
        !isAutoRejection &&
        new Date(application.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000 > Date.now()

      return (
        <div className="surface-card p-5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-rose-400">
            Curator application
          </p>
          <p className="mt-1 text-sm font-medium text-white">Not approved</p>
          <p className="mt-1 text-xs text-white/40">
            {application.rejectionReason}
          </p>
          {!cooldownActive && (
            <Link href="/apply-curator" className="mt-3 inline-block text-xs font-medium text-acid hover:text-acid/80 transition">
              Apply again &rarr;
            </Link>
          )}
        </div>
      )
    }
  }

  // No application yet — show CTA
  return (
    <div className="surface-card p-5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/40">
        Earn more
      </p>
      <h3 className="mt-1 text-base font-bold text-white">
        Got a playlist? Become a curator.
      </h3>
      <p className="mt-1 text-sm text-white/40">
        Apply to review tracks, give feedback, and earn on SoundSwap.
      </p>
      <Link href="/apply-curator" className="button-primary mt-4 text-xs">
        Apply now &rarr;
      </Link>
    </div>
  )
}
