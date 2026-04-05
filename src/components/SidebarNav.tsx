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

interface SidebarNavProps {
  orientation?: 'vertical' | 'horizontal'
}

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    detail: 'Overview',
    icon: DashboardIcon,
  },
  {
    href: '/listen',
    label: 'Listen & Earn',
    detail: 'Queue',
    icon: HeadphonesIcon,
  },
  {
    href: '/submit',
    label: 'Submit Track',
    detail: 'Promotion',
    icon: UploadIcon,
  },
  {
    href: '/my-tracks',
    label: 'My Tracks',
    detail: 'Catalog',
    icon: TracksIcon,
  },
  {
    href: '/earnings',
    label: 'Earnings',
    detail: 'Credits',
    icon: WalletIcon,
  },
] as const

export default function SidebarNav({
  orientation = 'vertical',
}: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'flex gap-2',
        orientation === 'vertical'
          ? 'flex-col'
          : 'overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      )}
      aria-label="Primary navigation"
    >
      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href))
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'group relative flex min-w-fit items-center gap-3 rounded-2xl border px-4 py-3 transition duration-200',
              orientation === 'vertical' ? 'w-full' : 'shrink-0',
              active
                ? 'border-brand-400/30 bg-brand-500/12 text-white shadow-[0_18px_50px_-28px_rgba(34,197,94,0.85)]'
                : 'border-white/[0.06] bg-white/[0.03] text-slate-400 hover:border-white/10 hover:bg-white/[0.05] hover:text-slate-200'
            )}
          >
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-2xl border transition',
                active
                  ? 'border-brand-400/20 bg-brand-500/16 text-brand-300'
                  : 'border-white/10 bg-white/[0.04] text-slate-400 group-hover:border-white/15 group-hover:text-slate-200'
              )}
            >
              <Icon className="h-4 w-4" />
            </span>

            <span className="flex flex-col">
              <span className="text-sm font-medium">{item.label}</span>
              <span className="text-xs text-slate-500">{item.detail}</span>
            </span>
          </Link>
        )
      })}

      {orientation === 'vertical' && (
        <SignOutButton redirectUrl="/">
          <button className="group mt-2 flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-slate-400 transition duration-200 hover:border-white/10 hover:bg-white/[0.05] hover:text-slate-200">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400 transition group-hover:border-white/15 group-hover:text-slate-200">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span className="flex flex-col text-left">
              <span className="text-sm font-medium">Sign out</span>
              <span className="text-xs text-slate-500">End session</span>
            </span>
          </button>
        </SignOutButton>
      )}
    </nav>
  )
}
