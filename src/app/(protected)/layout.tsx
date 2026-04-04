import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import AppLogo from '@/components/AppLogo'
import CreditBadge from '@/components/CreditBadge'
import SidebarNav from '@/components/SidebarNav'
import { ArrowUpRightIcon, BoltIcon } from '@/components/AppIcons'
import { clerkAppearance } from '@/lib/clerk-appearance'

/**
 * Shared layout for all authenticated pages.
 * Shows the creator workspace shell used across all authenticated pages.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="hero-orb left-[-8rem] top-[-4rem] h-64 w-64 bg-brand-500/15" />
      <div className="hero-orb bottom-[-10rem] right-[-5rem] h-72 w-72 bg-sky-500/10" />

      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col md:flex-row">
        <aside className="hidden w-[320px] shrink-0 p-6 md:block">
          <div className="surface-card sticky top-6 flex h-[calc(100vh-3rem)] flex-col overflow-hidden p-6">
            <div className="flex items-center justify-between">
              <AppLogo href="/dashboard" />
              <UserButton
                afterSignOutUrl="/"
                appearance={clerkAppearance}
              />
            </div>

            <div className="mt-8">
              <SidebarNav />
            </div>

            <div className="mt-auto space-y-4">
              <div className="surface-card-soft p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="eyebrow-badge px-3 py-1.5 normal-case tracking-[0.18em]">
                    <BoltIcon className="h-4 w-4" />
                    Live credits
                  </span>
                  <Link
                    href="/listen"
                    className="button-ghost gap-1 px-0 py-0 text-xs"
                  >
                    Queue
                    <ArrowUpRightIcon className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <CreditBadge />
                <p className="mt-4 text-sm leading-6 text-slate-400">
                  Keep your balance moving: one completed listen funds the next
                  promotion cycle.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 px-4 pb-10 pt-4 sm:px-6 md:px-8 md:py-6">
          <div className="surface-card mb-4 flex items-center justify-between gap-4 p-4 md:hidden">
            <AppLogo href="/dashboard" />
            <div className="flex items-center gap-3">
              <CreditBadge />
              <UserButton afterSignOutUrl="/" appearance={clerkAppearance} />
            </div>
          </div>

          <div className="mb-6 md:hidden">
            <SidebarNav orientation="horizontal" />
          </div>

          <main className="space-y-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
