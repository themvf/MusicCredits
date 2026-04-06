import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: ReactNode
  tone?: 'default' | 'brand'
}

export default function StatCard({ label, value, sub, icon, tone = 'default' }: StatCardProps) {
  return (
    <div className="surface-card-soft p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/30">
            {label}
          </p>
          <p className="text-3xl font-black tracking-tight text-white">
            {value}
          </p>
        </div>
        {icon && (
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
              tone === 'brand'
                ? 'border-acid/20 bg-acid/8 text-acid'
                : 'border-white/8 bg-white/[0.03] text-white/40'
            }`}
          >
            {icon}
          </span>
        )}
      </div>
      {sub && <p className="mt-3 text-xs leading-5 text-white/30">{sub}</p>}
    </div>
  )
}
