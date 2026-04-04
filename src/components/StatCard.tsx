import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: ReactNode
  tone?: 'default' | 'brand'
}

export default function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'default',
}: StatCardProps) {
  return (
    <div className="surface-card-soft p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            {label}
          </p>
          <p className="text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
        </div>
        {icon && (
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
              tone === 'brand'
                ? 'border-brand-400/20 bg-brand-500/12 text-brand-300'
                : 'border-white/10 bg-white/[0.04] text-slate-300'
            }`}
          >
            {icon}
          </span>
        )}
      </div>
      {sub && <p className="mt-3 text-sm leading-6 text-slate-400">{sub}</p>}
    </div>
  )
}
