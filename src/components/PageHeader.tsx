import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl space-y-3">
        {eyebrow && (
          <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[0.7rem] font-medium uppercase tracking-[0.28em] text-brand-300/90">
            {eyebrow}
          </p>
        )}
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            {description}
          </p>
        </div>
      </div>

      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}
