import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}

export default function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl space-y-2">
        {eyebrow && (
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-acid">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-white/40 sm:text-base">
          {description}
        </p>
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}
