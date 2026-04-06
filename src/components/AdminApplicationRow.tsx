'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'

interface Props {
  applicationId: string
  displayName: string
  appliedAt: string
  playlistName: string
  playlistUrl: string
  followerCount: number
  genres: string[]
  motivation: string
  completedSessions: number
  avgRating: string | null
  rejectionReasons: string[]
}

export default function AdminApplicationRow({
  applicationId,
  displayName,
  appliedAt,
  playlistName,
  playlistUrl,
  followerCount,
  genres,
  motivation,
  completedSessions,
  avgRating,
  rejectionReasons,
}: Props) {
  const router = useRouter()
  const [rejecting, setRejecting] = useState(false)
  const [selectedReason, setSelectedReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)

  const appliedDate = new Date(appliedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  async function submit(decision: 'approve' | 'reject') {
    if (decision === 'reject' && !selectedReason) return
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          decision === 'approve'
            ? { decision: 'approve' }
            : { decision: 'reject', reason: selectedReason }
        ),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'Something went wrong')
        return
      }

      setDone(decision === 'approve' ? 'approved' : 'rejected')
      router.refresh()
    } catch {
      alert('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="surface-card p-5 opacity-50">
        <p className="text-sm text-white/40">
          {displayName} — {done}
        </p>
      </div>
    )
  }

  return (
    <div className="surface-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Applicant info */}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-white">{displayName}</span>
            <span className="text-xs text-white/30">Applied {appliedDate}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-acid hover:text-acid/80 transition"
            >
              {playlistName} ↗
            </a>
            <span className="text-xs text-white/40">
              {followerCount.toLocaleString()} followers
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {genres.map((g) => (
              <span
                key={g}
                className="rounded-full border border-white/10 px-2 py-0.5 text-[0.65rem] text-white/40"
              >
                {g}
              </span>
            ))}
          </div>

          {motivation && (
            <p className="text-sm text-white/60 italic">&ldquo;{motivation}&rdquo;</p>
          )}

          <div className="flex gap-4 text-xs text-white/30">
            <span>{completedSessions} sessions completed</span>
            {avgRating && <span>{avgRating} avg rating</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col gap-2">
          {!rejecting ? (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={() => submit('approve')}
                className={cn(
                  'rounded-xl bg-acid px-4 py-2 text-sm font-bold text-[#0D0D0D] transition hover:opacity-90',
                  loading && 'opacity-50 cursor-wait'
                )}
              >
                Approve
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setRejecting(true)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:border-white/20 hover:text-white"
              >
                Reject
              </button>
            </>
          ) : (
            <div className="w-64 space-y-2">
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
              >
                <option value="">Select a reason...</option>
                {rejectionReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!selectedReason || loading}
                  onClick={() => submit('reject')}
                  className={cn(
                    'flex-1 rounded-xl bg-rose-500/20 px-3 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/30',
                    (!selectedReason || loading) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  Confirm reject
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setRejecting(false)}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/40 hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
