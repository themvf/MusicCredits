import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import { ArrowUpRightIcon, TracksIcon } from '@/components/AppIcons'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function PlaylistVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{
    trackId?: string
    spotify?: string
  }>
}) {
  const { trackId, spotify } = await searchParams

  if (trackId) {
    const user = await getAuthenticatedUser()
    const session = await prisma.listeningSession.findUnique({
      where: {
        userId_trackId: {
          userId: user.id,
          trackId,
        },
      },
    })

    if (session) {
      const target = new URLSearchParams({
        trackId,
        sessionId: session.id,
      })

      if (spotify === 'connected' || spotify === 'error') {
        target.set('spotify', spotify)
      }

      redirect(`/listen?${target.toString()}`)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Playlist Verify"
        title="Playlist verification now lives inside the session"
        description="Open an active listen session to continue the inline verification wizard."
        actions={
          <Link href="/listen" className="button-primary">
            Open listen flow
          </Link>
        }
      />

      <div className="surface-card p-8">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-white/10 bg-white/[0.04] text-brand-300">
            <TracksIcon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-lg font-semibold text-white">
              Continue from Listen &amp; Earn
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              SoundSwap now keeps listening, feedback, and playlist verification
              in one continuous flow instead of sending you to a separate page.
            </p>
          </div>
        </div>

        <Link href="/listen" className="button-ghost mt-6 gap-1 px-0 py-0">
          Back to listen
          <ArrowUpRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
