'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'

interface CuratorPlaylistItem {
  playlistName: string
  followers: number
}

interface Props {
  userId: string
  displayName: string
  approvedAt: string
  playlists: CuratorPlaylistItem[]
  reviewsCompleted: number
}

export default function AdminCuratorRow({
  userId,
  displayName,
  approvedAt,
  playlists,
  reviewsCompleted,
}: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const approvedDate = new Date(approvedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  async function handleRemove() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/remove-curator`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'Something went wrong')
        return
      }

      setDone(true)
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
        <p className="text-sm text-white/40">{displayName} — curator access removed</p>
      </div>
    )
  }

  return (
    <div className="surface-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-white">{displayName}</span>
            <span className="text-xs text-white/30">Approved {approvedDate}</span>
          </div>

          <div className="space-y-1">
            {playlists.map((p) => (
              <p key={p.playlistName} className="text-sm text-white/50">
                {p.playlistName}{' '}
                <span className="text-white/30">· {p.followers.toLocaleString()} followers</span>
              </p>
            ))}
          </div>

          <p className="text-xs text-white/30">{reviewsCompleted} reviews completed</p>
        </div>

        <div className="shrink-0">
          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/50 transition hover:border-rose-400/30 hover:text-rose-300"
            >
              Remove curator
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">Are you sure?</span>
              <button
                type="button"
                disabled={loading}
                onClick={handleRemove}
                className={cn(
                  'rounded-xl bg-rose-500/20 px-3 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/30',
                  loading && 'cursor-wait opacity-50'
                )}
              >
                {loading ? 'Removing...' : 'Yes, remove'}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setConfirming(false)}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/40 transition hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
