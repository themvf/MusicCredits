import { BoltIcon } from '@/components/AppIcons'
import { getAuthenticatedUser } from '@/lib/auth'

/**
 * Server component: fetches the current user's credit balance from DB
 * and renders a compact balance indicator for the shell.
 */
export default async function CreditBadge() {
  try {
    const user = await getAuthenticatedUser()
    return (
      <div className="inline-flex items-center gap-3 rounded-2xl border border-brand-400/15 bg-brand-500/10 px-4 py-3 text-left shadow-[0_18px_50px_-32px_rgba(34,197,94,0.9)]">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-400/20 bg-brand-500/14 text-brand-300">
          <BoltIcon className="h-4 w-4" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-[0.68rem] uppercase tracking-[0.2em] text-brand-300/80">
            Credits
          </span>
          <span className="mt-1 text-lg font-semibold text-white">
            {user.credits}
          </span>
        </span>
      </div>
    )
  } catch {
    return null
  }
}
