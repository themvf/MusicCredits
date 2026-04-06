import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import AppLogo from '@/components/AppLogo'
import CreditBadge from '@/components/CreditBadge'
import SidebarNav from '@/components/SidebarNav'
import { ArrowUpRightIcon, BoltIcon } from '@/components/AppIcons'
import { clerkAppearance } from '@/lib/clerk-appearance'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col md:flex-row">

        {/* Sidebar */}
        <aside className="hidden w-[300px] shrink-0 md:block">
          <div className="sticky top-0 flex h-screen flex-col border-r border-white/8 bg-[#111111] px-5 py-6">
            {/* Logo + avatar */}
            <div className="flex items-center justify-between">
              <AppLogo href="/dashboard" />
              <UserButton afterSignOutUrl="/" appearance={clerkAppearance} />
            </div>

            {/* Nav */}
            <div className="mt-8 flex-1">
              <SidebarNav />
            </div>

            {/* Credit panel */}
            <div className="mt-auto border-t border-white/8 pt-5">
              <div className="rounded-xl border border-white/8 bg-[#0D0D0D] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-acid">
                    <BoltIcon className="h-3.5 w-3.5" />
                    Live credits
                  </span>
                  <Link href="/listen" className="text-xs text-white/30 transition hover:text-acid flex items-center gap-1">
                    Queue
                    <ArrowUpRightIcon className="h-3 w-3" />
                  </Link>
                </div>
                <CreditBadge />
                <p className="mt-3 text-xs leading-5 text-white/30">
                  One listen = one credit. Ten credits queues a track.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 px-4 pb-10 pt-4 sm:px-6 md:px-8 md:py-6">
          {/* Mobile top bar */}
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-white/8 pb-4 md:hidden">
            <AppLogo href="/dashboard" />
            <div className="flex items-center gap-3">
              <CreditBadge />
              <UserButton afterSignOutUrl="/" appearance={clerkAppearance} />
            </div>
          </div>

          {/* Mobile nav */}
          <div className="mb-6 md:hidden">
            <SidebarNav orientation="horizontal" />
          </div>

          <main className="space-y-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
