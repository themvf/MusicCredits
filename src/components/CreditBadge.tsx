import { BoltIcon } from '@/components/AppIcons'
import { getAuthenticatedUser } from '@/lib/auth'

export default async function CreditBadge() {
  try {
    const user = await getAuthenticatedUser()
    return (
      <div className="inline-flex items-center gap-3 rounded-xl border border-acid/20 bg-acid/6 px-3 py-2.5 text-left">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-acid/20 bg-acid/8 text-acid">
          <BoltIcon className="h-4 w-4" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-[0.65rem] uppercase tracking-[0.2em] text-acid/70">
            Credits
          </span>
          <span className="mt-1 text-base font-bold text-white">
            {user.credits}
          </span>
        </span>
      </div>
    )
  } catch {
    return null
  }
}
