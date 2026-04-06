import Link from 'next/link'
import { cn } from '@/lib/cn'

interface AppLogoProps {
  className?: string
  href?: string
  markOnly?: boolean
}

function LogoMark() {
  return (
    <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-acid/20 bg-acid/8">
      <div className="relative flex items-end gap-0.5">
        <span className="h-3 w-1 rounded-full bg-acid/60" />
        <span className="h-5 w-1 rounded-full bg-acid/80" />
        <span className="h-7 w-1 rounded-full bg-acid" />
        <span className="h-4 w-1 rounded-full bg-acid/70" />
      </div>
    </div>
  )
}

export default function AppLogo({ className, href = '/', markOnly = false }: AppLogoProps) {
  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {!markOnly && (
        <span className="flex flex-col leading-none">
          <span className="text-[0.65rem] uppercase tracking-[0.32em] text-white/30">
            Creator Growth
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            Sound<span className="text-acid">Swap</span>
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
