import { getAuthenticatedUser } from '@/lib/auth'

/**
 * Server component: fetches the current user's credit balance from DB
 * and renders a badge in the nav. Re-renders on every navigation because
 * Next.js server components are not cached across requests by default.
 */
export default async function CreditBadge() {
  try {
    const user = await getAuthenticatedUser()
    return (
      <span className="inline-flex items-center gap-1.5 bg-green-950 text-green-400 text-sm font-semibold px-3 py-1 rounded-full border border-green-800">
        <span>⚡</span>
        <span>{user.credits} credits</span>
      </span>
    )
  } catch {
    // If not authenticated (edge case during SSR), render nothing
    return null
  }
}
