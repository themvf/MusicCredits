'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app/error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4">
      <main className="max-w-xl mx-auto min-h-screen flex flex-col items-center justify-center text-center gap-6">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.25em] text-red-400">
            Application Error
          </p>
          <h1 className="text-4xl font-bold">Something went wrong</h1>
          <p className="text-gray-400">
            The app hit an unexpected error. You can retry the request or go
            back to the dashboard.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-3 rounded-xl bg-green-500 text-black font-semibold hover:bg-green-400 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-3 rounded-xl border border-gray-700 text-gray-200 hover:border-gray-500 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
