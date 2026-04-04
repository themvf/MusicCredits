import { ActivityIcon, BoltIcon, UploadIcon } from '@/components/AppIcons'
import type { ActivityEntry } from '@/lib/creator-analytics'

interface ActivityFeedProps {
  items: ActivityEntry[]
}

export default function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="surface-card-soft p-6 text-sm leading-7 text-slate-400">
        No activity yet. Start listening or queue a track to build your first
        creator cycle.
      </div>
    )
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <h3 className="text-lg font-semibold text-white">Activity feed</h3>
          <p className="mt-1 text-sm text-slate-400">
            Live actions across submissions and completed listens.
          </p>
        </div>
      </div>

      <div className="divide-y divide-white/6">
        {items.slice(0, 8).map((item) => {
          const Icon = item.type === 'submission' ? UploadIcon : BoltIcon

          return (
            <div
              key={item.id}
              className="flex items-start gap-4 px-6 py-4 transition hover:bg-white/[0.03]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand-300">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">
                    {item.type}
                  </span>
                </div>
                <p className="text-sm leading-6 text-slate-400">
                  {item.description}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                <ActivityIcon className="h-3.5 w-3.5" />
                {new Date(item.createdAt).toLocaleDateString()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
