'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRightIcon,
  BoltIcon,
  CheckIcon,
  ClockIcon,
  SparkIcon,
  TracksIcon,
  WaveformIcon,
  XIcon,
} from '@/components/AppIcons'
import StatusToast from '@/components/StatusToast'
import {
  getSpotifyTrackLabel,
  getSpotifyTrackOpenUrl,
  getSpotifyTrackReference,
} from '@/lib/spotify'

const VERIFY_DELAY_MS = 15_000
const RECHECK_DELAY_MS = 5 * 60_000

interface PlaylistOption {
  id: string
  spotifyPlaylistId: string
  name: string
  spotifyUrl: string | null
  followers: number
  trackCount: number
  lastSyncedAt: string
}

interface SnapshotState {
  id: string
  playlistId: string
  createdAt: string
}

interface VerificationState {
  id: string
  playlistId: string
  playlistName: string
  playlistUrl: string | null
  verified: boolean
  quality: 'pending' | 'verified' | 'failed' | 'low_quality'
  verificationType: 'snapshot' | 'platform'
  verifiedAt: string | null
  persistenceDueAt: string | null
}

interface PlaylistVerificationCardProps {
  trackId: string
  spotifyUrl: string
  connectUrl: string
  spotifyConnected: boolean
  canVerify: boolean
  callbackStatus: 'connected' | 'error' | null
  initialSnapshot: SnapshotState | null
  initialVerification: VerificationState | null
}

export default function PlaylistVerificationCard({
  trackId,
  spotifyUrl,
  connectUrl,
  spotifyConnected,
  canVerify,
  callbackStatus,
  initialSnapshot,
  initialVerification,
}: PlaylistVerificationCardProps) {
  const [connected, setConnected] = useState(spotifyConnected)
  const [playlists, setPlaylists] = useState<PlaylistOption[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(
    initialSnapshot?.playlistId ?? initialVerification?.playlistId ?? ''
  )
  const [snapshot, setSnapshot] = useState<SnapshotState | null>(initialSnapshot)
  const [verification, setVerification] = useState<VerificationState | null>(
    initialVerification
  )
  const [submittingSnapshot, setSubmittingSnapshot] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [rechecking, setRechecking] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [toast, setToast] = useState<{
    open: boolean
    tone: 'success' | 'error' | 'info'
    title: string
    description?: string
  }>({
    open: false,
    tone: 'info',
    title: '',
  })

  const trackLabel = getSpotifyTrackLabel(spotifyUrl)
  const trackReference = getSpotifyTrackReference(spotifyUrl)
  const spotifyTrackOpenUrl = getSpotifyTrackOpenUrl(spotifyUrl)

  useEffect(() => {
    if (!snapshot && !verification?.verifiedAt) {
      return
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [snapshot, verification?.verifiedAt])

  useEffect(() => {
    if (callbackStatus === 'connected') {
      setToast({
        open: true,
        tone: 'success',
        title: 'Spotify connected',
        description: 'Your playlists are ready to sync and verify.',
      })
    }

    if (callbackStatus === 'error') {
      setToast({
        open: true,
        tone: 'error',
        title: 'Spotify connection failed',
        description: 'Reconnect Spotify and try the verification flow again.',
      })
    }
  }, [callbackStatus])

  useEffect(() => {
    if (!connected) {
      return
    }

    let cancelled = false

    async function loadPlaylists() {
      setLoadingPlaylists(true)

      try {
        const res = await fetch('/api/spotify/playlists', {
          cache: 'no-store',
        })

        if (res.status === 404) {
          if (!cancelled) {
            setConnected(false)
          }
          return
        }

        if (!res.ok) {
          throw new Error('Could not load playlists')
        }

        const data = (await res.json()) as { playlists: PlaylistOption[] }

        if (!cancelled) {
          setPlaylists(data.playlists)

          if (!selectedPlaylistId && data.playlists[0]) {
            setSelectedPlaylistId(data.playlists[0].id)
          }
        }
      } catch {
        if (!cancelled) {
          setToast({
            open: true,
            tone: 'error',
            title: 'Playlist sync failed',
            description: 'Spotify playlists could not be loaded right now.',
          })
        }
      } finally {
        if (!cancelled) {
          setLoadingPlaylists(false)
        }
      }
    }

    loadPlaylists()

    return () => {
      cancelled = true
    }
  }, [connected])

  const selectedPlaylist =
    playlists.find((playlist) => playlist.id === selectedPlaylistId) ??
    (verification
      ? {
          id: verification.playlistId,
          spotifyPlaylistId: '',
          name: verification.playlistName,
          spotifyUrl: verification.playlistUrl,
          followers: 0,
          trackCount: 0,
          lastSyncedAt: new Date().toISOString(),
        }
      : null)

  const verifyReadyAt = snapshot
    ? new Date(snapshot.createdAt).getTime() + VERIFY_DELAY_MS
    : null
  const verifyCountdownMs = verifyReadyAt ? Math.max(0, verifyReadyAt - now) : 0
  const verifyProgress = verifyReadyAt
    ? Math.min(((VERIFY_DELAY_MS - verifyCountdownMs) / VERIFY_DELAY_MS) * 100, 100)
    : 0

  const recheckReadyAt = verification?.verifiedAt
    ? verification.persistenceDueAt
      ? new Date(verification.persistenceDueAt).getTime()
      : new Date(verification.verifiedAt).getTime() + RECHECK_DELAY_MS
    : null
  const recheckCountdownMs = recheckReadyAt
    ? Math.max(0, recheckReadyAt - now)
    : 0

  const state = verification?.quality === 'low_quality'
    ? 'low_quality'
    : verification?.verified
      ? 'verified'
    : verification?.quality === 'failed'
      ? 'failed'
      : snapshot
        ? 'snapshot_taken'
        : 'idle'

  async function handleTakeSnapshot() {
    if (!selectedPlaylistId) {
      setToast({
        open: true,
        tone: 'error',
        title: 'Select a playlist',
        description: 'Choose a Spotify playlist before taking the before snapshot.',
      })
      return
    }

    setSubmittingSnapshot(true)

    try {
      const res = await fetch('/api/playlist/snapshot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId,
          playlistId: selectedPlaylistId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Snapshot could not be created')
      }

      setSnapshot({
        id: data.snapshotId,
        playlistId: selectedPlaylistId,
        createdAt: data.createdAt ?? new Date().toISOString(),
      })
      setVerification(null)
      setToast({
        open: true,
        tone: 'success',
        title: 'Snapshot saved',
        description: 'Add the track in Spotify, then come back to verify the change.',
      })
    } catch (error) {
      setToast({
        open: true,
        tone: 'error',
        title: 'Snapshot failed',
        description:
          error instanceof Error
            ? error.message
            : 'The before state could not be captured.',
      })
    } finally {
      setSubmittingSnapshot(false)
    }
  }

  async function handleVerifyAdd() {
    if (!snapshot) {
      return
    }

    setVerifying(true)

    try {
      const res = await fetch('/api/playlist/snapshot/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshotId: snapshot.id,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      setVerification({
        id: data.verificationId,
        playlistId: selectedPlaylistId,
        playlistName: selectedPlaylist?.name ?? 'Selected playlist',
        playlistUrl: selectedPlaylist?.spotifyUrl ?? null,
        verified: data.verified,
        quality: data.quality,
        verificationType: data.verificationType,
        verifiedAt: data.verifiedAt,
        persistenceDueAt: data.persistenceDueAt,
      })
      setSnapshot(null)

      setToast({
        open: true,
        tone: data.verified ? 'success' : 'error',
        title: data.verified ? 'Playlist add verified' : 'Add not detected',
        description: data.verified
          ? 'Spotify confirmed the new add and queued an automatic five-minute persistence check.'
          : 'Spotify did not show a new add yet. Take a fresh snapshot and try again after adding the track.',
      })
    } catch (error) {
      setToast({
        open: true,
        tone: 'error',
        title: 'Verification failed',
        description:
          error instanceof Error
            ? error.message
            : 'Spotify could not verify this playlist change.',
      })
    } finally {
      setVerifying(false)
    }
  }

  async function handleRecheck() {
    if (!verification) {
      return
    }

    setRechecking(true)

    try {
      const res = await fetch(
        `/api/playlist/verifications/${verification.id}/recheck`,
        {
          method: 'POST',
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Re-check failed')
      }

      setVerification((current) =>
        current
          ? {
              ...current,
              verified: data.verified,
              quality: data.quality,
              persistenceDueAt: data.persistenceDueAt,
            }
          : current
      )

      setToast({
        open: true,
        tone: data.quality === 'low_quality' ? 'error' : 'success',
        title:
          data.quality === 'low_quality'
            ? 'Track removed too quickly'
            : 'Verification still holds',
        description:
          data.quality === 'low_quality'
            ? 'The track no longer appears in the playlist, so this add is now marked low quality.'
            : 'Spotify still shows the track in the selected playlist.',
      })
    } catch (error) {
      setToast({
        open: true,
        tone: 'error',
        title: 'Re-check failed',
        description:
          error instanceof Error
            ? error.message
            : 'The persistence check could not be completed.',
      })
    } finally {
      setRechecking(false)
    }
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <div className="surface-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <span className="eyebrow-badge">
                  <TracksIcon className="h-4 w-4" />
                  Playlist verification
                </span>
                <div>
                  <h2 className="text-2xl font-semibold text-white">{trackLabel}</h2>
                  <p className="mt-2 text-sm text-slate-400">{trackReference}</p>
                </div>
              </div>

              {spotifyTrackOpenUrl && (
                <a
                  href={spotifyTrackOpenUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="button-secondary"
                >
                  Open in Spotify
                  <ArrowUpRightIcon className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand-300">
                <WaveformIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-white">Verification rules</p>
                <p className="text-sm text-slate-400">
                  SoundSwap checks fresh Spotify data before and after the add. No
                  manual confirmation is trusted.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="surface-card-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Gate 1
                </p>
                <p className="mt-3 text-sm font-medium text-white">
                  30 seconds completed
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Verification unlocks only after the listening session is finished.
                </p>
              </div>
              <div className="surface-card-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Gate 2
                </p>
                <p className="mt-3 text-sm font-medium text-white">
                  Before snapshot
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  The selected playlist is captured first so existing tracks do not count.
                </p>
              </div>
              <div className="surface-card-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Gate 3
                </p>
                <p className="mt-3 text-sm font-medium text-white">
                  Fresh Spotify re-check
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  The track must appear in the after snapshot as a new addition.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-white">Verification console</p>
              <p className="mt-1 text-sm text-slate-400">
                Connect Spotify, choose a playlist, and confirm the add with live data.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-500">
              {state.replace('_', ' ')}
            </span>
          </div>

          {!canVerify && (
            <div className="mt-6 rounded-[1.4rem] border border-amber-400/20 bg-amber-500/10 p-5 text-sm text-amber-100">
              Complete the listening session and rating before starting playlist verification.
            </div>
          )}

          {!connected && canVerify && (
            <div className="mt-6 space-y-4 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand-300">
                  <SparkIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">Connect Spotify</p>
                  <p className="text-sm text-slate-400">
                    Spotify OAuth is required so SoundSwap can read your playlists and verify adds.
                  </p>
                </div>
              </div>

              <a href={connectUrl} className="button-primary w-full">
                Connect Spotify
                <ArrowUpRightIcon className="h-4 w-4" />
              </a>
            </div>
          )}

          {connected && canVerify && (
            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="playlist-selector"
                  className="text-sm font-medium text-white"
                >
                  Playlist
                </label>
                <select
                  id="playlist-selector"
                  value={selectedPlaylistId}
                  onChange={(event) => setSelectedPlaylistId(event.target.value)}
                  disabled={
                    loadingPlaylists ||
                    Boolean(snapshot) ||
                    Boolean(verification?.verifiedAt)
                  }
                  className="h-14 w-full rounded-[1.3rem] border border-white/10 bg-slate-950/80 px-4 text-base text-white outline-none transition focus:border-brand-400/40 focus:ring-2 focus:ring-brand-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Select a playlist</option>
                  {playlists.map((playlist) => (
                  <option key={playlist.id} value={playlist.id}>
                      {playlist.name} / {playlist.trackCount} tracks
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlaylist && (
                <div className="surface-card-soft p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {selectedPlaylist.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {selectedPlaylist.followers.toLocaleString()} followers /{' '}
                        {selectedPlaylist.trackCount} tracks
                      </p>
                    </div>
                    {selectedPlaylist.spotifyUrl && (
                      <a
                        href={selectedPlaylist.spotifyUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="button-ghost gap-1 px-0 py-0"
                      >
                        Open playlist
                        <ArrowUpRightIcon className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {state === 'idle' && (
                <button
                  type="button"
                  onClick={handleTakeSnapshot}
                  disabled={submittingSnapshot || loadingPlaylists || !selectedPlaylistId}
                  className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingSnapshot ? (
                    <>
                      <ClockIcon className="h-4 w-4" />
                      Saving snapshot...
                    </>
                  ) : (
                    <>
                      <ClockIcon className="h-4 w-4" />
                      Take Before Snapshot
                    </>
                  )}
                </button>
              )}

              {state === 'failed' && (
                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-rose-400/20 bg-rose-500/10 p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/12 text-rose-200">
                        <XIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">Add not detected</p>
                        <p className="text-sm text-slate-300">
                          Spotify did not show the track as a new playlist addition.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTakeSnapshot}
                    disabled={submittingSnapshot || !selectedPlaylistId}
                    className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ClockIcon className="h-4 w-4" />
                    Take Fresh Snapshot
                  </button>
                </div>
              )}

              {state === 'snapshot_taken' && snapshot && (
                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-brand-400/20 bg-brand-500/10 p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-400/20 bg-brand-500/12 text-brand-200">
                        <ClockIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">Before snapshot saved</p>
                        <p className="text-sm text-slate-300">
                          Add the track to {selectedPlaylist?.name ?? 'your playlist'}, then verify.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(34,197,94,0.95),rgba(59,130,246,0.8))] transition-[width] duration-500"
                          style={{ width: `${verifyProgress}%` }}
                        />
                      </div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {verifyCountdownMs > 0
                          ? `Verify unlocks in ${Math.ceil(verifyCountdownMs / 1000)}s`
                          : 'Verification unlocked'}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <a
                      href={spotifyTrackOpenUrl ?? spotifyUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="button-secondary w-full justify-center"
                    >
                      Add to Playlist
                      <ArrowUpRightIcon className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={handleVerifyAdd}
                      disabled={verifying || verifyCountdownMs > 0}
                      className="button-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {verifying ? (
                        <>
                          <SparkIcon className="h-4 w-4" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-4 w-4" />
                          Verify Add
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {(state === 'verified' || state === 'low_quality') && verification && (
                <div className="space-y-4">
                  <div
                    className={
                      state === 'low_quality'
                        ? 'rounded-[1.5rem] border border-amber-400/20 bg-amber-500/10 p-5'
                        : 'rounded-[1.5rem] border border-brand-400/20 bg-brand-500/10 p-5'
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          state === 'low_quality'
                            ? 'flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/12 text-amber-100'
                            : 'flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-400/20 bg-brand-500/12 text-brand-100'
                        }
                      >
                        {state === 'low_quality' ? (
                          <BoltIcon className="h-5 w-5" />
                        ) : (
                          <CheckIcon className="h-5 w-5" />
                        )}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {state === 'low_quality'
                            ? 'Removed before the hold window'
                            : 'Verified add confirmed'}
                        </p>
                        <p className="text-sm text-slate-300">
                          {state === 'low_quality'
                            ? 'Spotify no longer showed the track when the automatic persistence check ran, so this add no longer counts as verified.'
                            : `Spotify confirmed a real add in ${verification.playlistName}.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="surface-card-soft p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">Persistence check</p>
                        <p className="mt-1 text-sm text-slate-400">
                          SoundSwap runs the five-minute hold check automatically. The manual action stays available as a fallback.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRecheck}
                        disabled={rechecking || recheckCountdownMs > 0}
                        className="button-secondary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {rechecking ? 'Checking...' : 'Manual Re-check'}
                      </button>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,rgba(34,197,94,0.95),rgba(59,130,246,0.8))] transition-[width] duration-500"
                        style={{
                          width: `${
                            verification.verifiedAt
                              ? Math.min(
                                  ((RECHECK_DELAY_MS - recheckCountdownMs) /
                                    RECHECK_DELAY_MS) *
                                    100,
                                  100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {recheckCountdownMs > 0
                        ? `Automatic check runs in ${Math.ceil(recheckCountdownMs / 1000)}s`
                        : verification.persistenceDueAt
                          ? 'Automatic check due now'
                          : 'Automatic check recorded'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Flow summary
            </p>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>1. Sync your Spotify playlists.</li>
              <li>2. Save a before snapshot for the selected playlist.</li>
              <li>3. Add the track in Spotify.</li>
              <li>4. Verify against fresh Spotify playlist data.</li>
            </ol>
          </div>

          <div className="mt-4">
            <Link href="/dashboard" className="button-ghost gap-1 px-0 py-0">
              Back to dashboard
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <StatusToast
        open={toast.open}
        tone={toast.tone}
        title={toast.title}
        description={toast.description}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />
    </>
  )
}
