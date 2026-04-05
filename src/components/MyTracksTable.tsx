'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RatingStars from '@/components/RatingStars'
import StatusToast from '@/components/StatusToast'
import { ArrowUpRightIcon, TrashIcon } from '@/components/AppIcons'

interface PlaylistPlacement {
  playlistId: string
  playlistName: string
  playlistUrl: string | null
  verificationStatus: 'pending' | 'verified' | 'failed' | 'low_quality'
  currentTrackPosition: number | null
}

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
  playlistPlacements: PlaylistPlacement[]
}

interface MyTracksTableProps {
  tracks: Track[]
}

function getPlacementStatusCopy(status: PlaylistPlacement['verificationStatus']) {
  switch (status) {
    case 'verified':
      return {
        label: 'Verified',
        detail: 'Placement confirmed',
        className: 'border-brand-400/20 bg-brand-500/10 text-brand-100',
      }
    case 'pending':
      return {
        label: 'Pending',
        detail: 'Verification running',
        className: 'border-amber-400/20 bg-amber-500/10 text-amber-100',
      }
    case 'low_quality':
      return {
        label: 'Removed',
        detail: 'Removed during hold window',
        className: 'border-rose-400/20 bg-rose-500/10 text-rose-100',
      }
    case 'failed':
      return {
        label: 'Failed',
        detail: 'Add was not confirmed',
        className: 'border-white/10 bg-white/[0.04] text-slate-300',
      }
  }
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
        <div className="hidden grid-cols-[minmax(0,1.6fr)_0.72fr_0.82fr_1.2fr_0.72fr] gap-4 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[0.22em] text-slate-500 xl:grid">
          <span>Track</span>
          <span>Submitted</span>
          <span>Performance</span>
          <span>Placements</span>
          <span className="text-right">Action</span>
        </div>

        <div className="divide-y divide-white/6">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="grid gap-4 px-6 py-5 xl:grid-cols-[minmax(0,1.6fr)_0.72fr_0.82fr_1.2fr_0.72fr] xl:items-center"
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
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 xl:hidden">
                  Submitted
                </p>
                <p>{new Date(track.createdAt).toLocaleDateString()}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                  Added to queue
                </p>
              </div>

              <div className="space-y-2 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 xl:hidden">
                  Performance
                </p>
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

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 xl:hidden">
                  Placements
                </p>
                {track.playlistPlacements.length > 0 ? (
                  track.playlistPlacements.map((placement) => {
                    const placementCopy = getPlacementStatusCopy(
                      placement.verificationStatus
                    )

                    return (
                      <div
                        key={placement.playlistId}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            {placement.playlistUrl ? (
                              <a
                                href={placement.playlistUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex max-w-full items-center gap-1 text-sm font-medium text-white transition hover:text-brand-200"
                              >
                                <span className="truncate">
                                  {placement.playlistName}
                                </span>
                                <ArrowUpRightIcon className="h-3.5 w-3.5 shrink-0" />
                              </a>
                            ) : (
                              <p className="truncate text-sm font-medium text-white">
                                {placement.playlistName}
                              </p>
                            )}

                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                              {placement.verificationStatus === 'verified' &&
                              placement.currentTrackPosition !== null
                                ? `Position #${placement.currentTrackPosition}`
                                : placementCopy.detail}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] ${placementCopy.className}`}
                          >
                            {placementCopy.label}
                          </span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-slate-400">
                    No playlist verifications yet.
                  </div>
                )}
              </div>

              <div className="flex justify-start xl:justify-end">
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
