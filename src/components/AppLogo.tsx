import Link from 'next/link'
import { cn } from '@/lib/cn'

interface AppLogoProps {
  className?: string
  href?: string
  markOnly?: boolean
}

function LogoMark() {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-[0_20px_50px_-30px_rgba(34,197,94,0.9)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.42),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.24),transparent_45%,rgba(34,197,94,0.18))]" />
      <div className="relative flex items-end gap-1">
        <span className="h-4 w-1 rounded-full bg-brand-300" />
        <span className="h-6 w-1 rounded-full bg-brand-400" />
        <span className="h-8 w-1 rounded-full bg-white" />
        <span className="h-5 w-1 rounded-full bg-brand-400" />
      </div>
    </div>
  )
}

export default function AppLogo({
  className,
  href = '/',
  markOnly = false,
}: AppLogoProps) {
  const content = (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <LogoMark />
      {!markOnly && (
        <span className="flex flex-col leading-none">
          <span className="text-[0.72rem] uppercase tracking-[0.32em] text-slate-500">
            Creator Growth
          </span>
          <span className="text-xl font-semibold tracking-tight text-white">
            Sound<span className="text-brand-400">Swap</span>
          </span>
        </span>
      )}
    </span>
  )

  return (
    <Link href={href} className="inline-flex">
      {content}
    </Link>
  )
}
