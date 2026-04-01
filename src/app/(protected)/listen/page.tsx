import { Suspense } from 'react'
import ListenPageClient from '@/components/ListenPageClient'

/**
 * Server wrapper — search params must be passed down to a client component
 * because the actual player logic uses browser APIs (Page Visibility, timers).
 */
export default function ListenPage({
  searchParams,
}: {
  searchParams: { trackId?: string; sessionId?: string }
}) {
  const { trackId, sessionId } = searchParams

  if (!trackId || !sessionId) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <p className="text-red-400 text-lg">Missing track or session information.</p>
        <a href="/dashboard" className="mt-4 inline-block text-green-400 underline">
          Back to Dashboard
        </a>
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="text-gray-400">Loading player...</div>}>
      <ListenPageClient trackId={trackId} sessionId={sessionId} />
    </Suspense>
  )
}
