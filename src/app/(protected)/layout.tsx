import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import CreditBadge from '@/components/CreditBadge'

/**
 * Shared layout for all authenticated pages.
 * Shows the top nav with brand, credit balance, and user menu.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top navigation bar */}
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-xl font-extrabold text-white tracking-tight"
          >
            Sound<span className="text-green-400">Swap</span>
          </Link>

          <div className="flex items-center gap-5">
            {/* Server-rendered credit count fetched fresh on each navigation */}
            <CreditBadge />

            <Link
              href="/submit"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Submit Track
            </Link>

            <Link
              href="/dashboard"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Dashboard
            </Link>

            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  )
}
