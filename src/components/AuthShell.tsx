import type { ReactNode } from 'react'
import AppLogo from '@/components/AppLogo'
import {
  BoltIcon,
  HeadphonesIcon,
  ShieldIcon,
  WaveformIcon,
} from '@/components/AppIcons'

interface AuthShellProps {
  title: string
  description: string
  children: ReactNode
}

const highlights = [
  {
    title: 'Earn promotion credits',
    description: 'Every completed listen feeds your next campaign.',
    icon: BoltIcon,
  },
  {
    title: 'Real creator attention',
    description: 'Designed for focused, human listening instead of vanity plays.',
    icon: HeadphonesIcon,
  },
  {
    title: 'Fair and transparent',
    description: 'A clean credit loop that rewards consistency over spend.',
    icon: ShieldIcon,
  },
] as const

export default function AuthShell({
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_28%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-8">
          <AppLogo />
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-brand-300">
              <WaveformIcon className="h-4 w-4" />
              Creator exchange
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
                {description}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="surface-card space-y-3 p-5 transition duration-300 hover:-translate-y-1"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-brand-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="space-y-1.5">
                    <h2 className="text-sm font-semibold text-white">{item.title}</h2>
                    <p className="text-sm leading-6 text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="relative">
          <div className="surface-card mx-auto w-full max-w-md p-4 sm:p-6">
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 sm:p-6">
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
