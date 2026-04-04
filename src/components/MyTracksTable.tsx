'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RatingStars from '@/components/RatingStars'
import StatusToast from '@/components/StatusToast'
import { ArrowUpRightIcon, TrashIcon } from '@/components/AppIcons'

interface Track {
  id: string
  spotifyUrl: string
  spotifyTrackId: string | null
  title: string
  artistName: string
  artworkUrl: string | null
  createdAt: string
  listenCount: number
  averageRating: number | null
  ratingCount: number
}

interface MyTracksTableProps {
  tracks: Track[]
}

export default function MyTracksTable({ tracks }: MyTracksTableProps) {
  const router = useRouter()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toastOpen, setToastOpen] = useState(false)

  async function handleDelete(trackId: string) {
    setDeletingId(trackId)

    try {
      const res = await fetch(`/api/tracks/${trackId}`, { method: 'DELETE' })
      if (!res.ok) {
        setToastOpen(true)
        setDeletingId(null)
        return
      }

      router.refresh()
    } catch {
      setToastOpen(true)
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  if (tracks.length === 0) {
    return (
      <div className="surface-card-soft p-6 text-sm leading-7 text-slate-400">
        No tracks submitted yet. Queue your first release to start collecting
        verified listens.
      </div>
    )
  }

  return (
    <>
      <div className="surface-card overflow-hidden">
        <div className="hidden grid-cols-[minmax(0,2fr)_0.8fr_0.85fr_0.8fr] gap-4 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[0.22em] text-slate-500 md:grid">
          <span>Track</span>
          <span>Submitted</span>
          <span>Performance</span>
          <span className="text-right">Action</span>
        </div>

        <div className="divide-y divide-white/6">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="grid gap-4 px-6 py-5 md:grid-cols-[minmax(0,2fr)_0.8fr_0.85fr_0.8fr] md:items-center"
            >
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white">
                      {track.title}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-200">
                      {track.artistName}
                    </p>
                  </div>
                  <a
                    href={track.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button-ghost shrink-0 gap-1 px-0 py-0 text-xs"
                  >
                    Open
                    <ArrowUpRightIcon className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              <div className="text-sm text-slate-300">
                <p>{new Date(track.createdAt).toLocaleDateString()}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                  Added to queue
                </p>
              </div>

              <div className="space-y-2 text-sm text-slate-300">
                <p>
                  {track.listenCount} listen{track.listenCount !== 1 ? 's' : ''}
                </p>
                {track.averageRating !== null ? (
                  <div className="flex items-center gap-2">
                    <RatingStars value={track.averageRating} />
                    <span className="text-xs text-slate-500">
                      {track.averageRating.toFixed(1)} ({track.ratingCount})
                    </span>
                  </div>
                ) : (
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Waiting for ratings
                  </p>
                )}
              </div>

              <div className="flex justify-start md:justify-end">
                {confirmId === track.id ? (
                  <div className="flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-rose-400/15 bg-rose-500/8 px-3 py-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-rose-200">
                      Remove track?
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(track.id)}
                      disabled={deletingId === track.id}
                      className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-400 disabled:opacity-60"
                    >
                      {deletingId === track.id ? 'Removing...' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.05]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(track.id)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-rose-400/25 hover:bg-rose-500/10 hover:text-rose-100"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <StatusToast
        open={toastOpen}
        tone="error"
        title="Could not remove track"
        description="Please try again after the queue refreshes."
        onClose={() => setToastOpen(false)}
      />
    </>
  )
}
