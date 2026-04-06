'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'
import {
  DashboardIcon,
  HeadphonesIcon,
  TracksIcon,
  UploadIcon,
  WalletIcon,
} from '@/components/AppIcons'
import { cn } from '@/lib/cn'
import { usePersona } from '@/providers/PersonaProvider'

interface SidebarNavProps {
  orientation?: 'vertical' | 'horizontal'
}

const artistNavItems = [
  { href: '/dashboard', label: 'Dashboard', detail: 'Overview', icon: DashboardIcon },
  { href: '/listen', label: 'Listen & Earn', detail: 'Queue', icon: HeadphonesIcon },
  { href: '/submit', label: 'Submit Track', detail: 'Promotion', icon: UploadIcon },
  { href: '/my-tracks', label: 'My Tracks', detail: 'Catalog', icon: TracksIcon },
  { href: '/earnings', label: 'Earnings', detail: 'Credits', icon: WalletIcon },
] as const

const curatorNavItems = [
  { href: '/dashboard', label: 'Dashboard', detail: 'Overview', icon: DashboardIcon },
  { href: '/review', label: 'Review Queue', detail: 'Listen', icon: HeadphonesIcon },
  { href: '/earnings', label: 'Earnings', detail: 'Credits', icon: WalletIcon },
] as const

export default function SidebarNav({ orientation = 'vertical' }: SidebarNavProps) {
  const pathname = usePathname()
  const { persona, setPersona, role } = usePersona()

  const navItems = persona === 'curator' ? curatorNavItems : artistNavItems

  return (
    <nav
      className={cn(
        'flex gap-1.5',
        orientation === 'vertical'
          ? 'flex-col'
          : 'overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      )}
      aria-label="Primary navigation"
    >
      {/* Persona toggle — only visible for role: both */}
      {role === 'both' && orientation === 'vertical' && (
        <div className="mb-3 flex rounded-xl border border-white/8 bg-[#0D0D0D] p-1">
          <button
            onClick={() => setPersona('artist')}
            className={cn(
              'flex-1 rounded-lg py-2 text-xs font-semibold transition duration-150',
              persona === 'artist'
                ? 'bg-acid text-[#0D0D0D]'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            Artist
          </button>
          <button
            onClick={() => setPersona('curator')}
            className={cn(
              'flex-1 rounded-lg py-2 text-xs font-semibold transition duration-150',
              persona === 'curator'
                ? 'bg-acid text-[#0D0D0D]'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            Curator
          </button>
        </div>
      )}

      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href))
        const Icon = item.icon

        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={cn(
              'group flex min-w-fit items-center gap-3 rounded-xl border px-3 py-2.5 transition duration-150',
              orientation === 'vertical' ? 'w-full' : 'shrink-0',
              active
                ? 'border-acid/20 bg-acid/8 text-acid'
                : 'border-transparent text-white/40 hover:border-white/8 hover:bg-white/[0.03] hover:text-white'
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg border transition',
                active
                  ? 'border-acid/25 bg-acid/10 text-acid'
                  : 'border-white/8 bg-white/[0.03] text-white/30 group-hover:border-white/12 group-hover:text-white/60'
              )}
            >
              <Icon className="h-4 w-4" />
            </span>

            <span className="flex flex-col">
              <span className="text-sm font-medium">{item.label}</span>
              <span className={cn('text-xs', active ? 'text-acid/60' : 'text-white/25')}>
                {item.detail}
              </span>
            </span>
          </Link>
        )
      })}

      {orientation === 'vertical' && (
        <SignOutButton redirectUrl="/">
          <button className="group mt-3 flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-white/30 transition duration-150 hover:border-white/8 hover:bg-white/[0.03] hover:text-white/60">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] text-white/25 transition group-hover:border-white/12 group-hover:text-white/50">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span className="flex flex-col text-left">
              <span className="text-sm font-medium">Sign out</span>
              <span className="text-xs text-white/20">End session</span>
            </span>
          </button>
        </SignOutButton>
      )}
    </nav>
  )
}
