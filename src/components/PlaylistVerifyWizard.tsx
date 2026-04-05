'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import StatusToast from '@/components/StatusToast'
import {
  ArrowUpRightIcon,
  CheckIcon,
  ClockIcon,
  LockIcon,
  SparkIcon,
  TracksIcon,
  XIcon,
} from '@/components/AppIcons'
import { cn } from '@/lib/cn'
import { useSessionFlow } from '@/hooks/useSessionFlow'

const VERIFY_DELAY_MS = 15_000

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

export interface VerificationState {
  id: string
  playlistId: string
  playlistName: string
  playlistUrl: string | null
  verified: boolean
  quality: 'pending' | 'verified' | 'failed' | 'low_quality'
  verificationType: 'snapshot' | 'platform'
  currentTrackPosition: number | null
  verifiedAt: string | null
  persistenceDueAt: string | null
}

interface PlaylistVerifyWizardProps {
  trackId: string
  trackTitle: string
  artistName: string
  connectUrl: string
  spotifyConnected: boolean
  callbackStatus: 'connected' | 'error' | null
  initialSnapshot: SnapshotState | null
  initialVerification: VerificationState | null
  onVerified: (verification: VerificationState) => void
  className?: string
}

type StepStatus = 'complete' | 'active' | 'locked'

function StepShell({
  stepNumber,
  title,
  status,
  summary,
  children,
}: {
  stepNumber: number
  title: string
  status: StepStatus
  summary?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-[1.45rem] border border-white/10 bg-slate-950/68 px-5 py-4 transition',
        status === 'active' && 'border-brand-400/25 shadow-[inset_3px_0_0_rgba(30,215,96,0.9)]',
        status === 'locked' && 'opacity-45'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold',
                status === 'complete'
                  ? 'border-brand-400/25 bg-brand-500/12 text-brand-200'
                  : status === 'active'
                    ? 'border-brand-400/20 bg-brand-500/10 text-brand-200'
                    : 'border-white/10 bg-white/[0.03] text-slate-500'
              )}
            >
              {status === 'complete' ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                stepNumber
              )}
            </span>
            <div>
              <p className="text-sm font-medium text-white">{title}</p>
              {summary && (
                <p className="mt-1 text-sm text-slate-400">{summary}</p>
              )}
            </div>
          </div>
        </div>

        {status === 'locked' ? (
          <LockIcon className="h-4 w-4 shrink-0 text-slate-500" />
        ) : status === 'complete' ? (
          <CheckIcon className="h-4 w-4 shrink-0 text-brand-300" />
        ) : null}
      </div>

      {status === 'active' && children ? (
        <div className="mt-4 border-t border-white/10 pt-4">{children}</div>
      ) : null}
    </div>
  )
}

export default function PlaylistVerifyWizard({
  trackId,
  trackTitle,
  artistName,
  connectUrl,
  spotifyConnected,
  callbackStatus,
  initialSnapshot,
  initialVerification,
  onVerified,
  className,
}: PlaylistVerifyWizardProps) {
  const {
    state,
    markSnapshotTaken,
    markAwaitingUserAdd,
    markVerifying,
    markVerified,
    markVerifyFailed,
    setState,
  } = useSessionFlow()
  const [connected, setConnected] = useState(spotifyConnected)
  const [playlists, setPlaylists] = useState<PlaylistOption[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(
    initialSnapshot?.playlistId ?? initialVerification?.playlistId ?? ''
  )
  const [snapshot, setSnapshot] = useState<SnapshotState | null>(initialSnapshot)
  const [submittingSnapshot, setSubmittingSnapshot] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(
    initialVerification?.quality === 'failed'
      ? 'Track not found in the playlist yet. Try again in a few seconds.'
      : initialVerification?.quality === 'low_quality'
        ? 'The add was removed during the hold window. Start again with a fresh snapshot.'
        : null
  )
  const [now, setNow] = useState(Date.now())
  const [toast, setToast] = useState<{
    open: boolean
    tone: 'success' | 'error'
    title: string
    description?: string
  }>({
    open: false,
    tone: 'success',
    title: '',
  })

  useEffect(() => {
    if (!snapshot) {
      return
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [snapshot])

  useEffect(() => {
    if (callbackStatus === 'connected') {
      setConnected(true)
      setToast({
        open: true,
        tone: 'success',
        title: 'Spotify connected',
        description: 'Your playlists are ready to verify this track.',
      })
    }

    if (callbackStatus === 'error') {
      setToast({
        open: true,
        tone: 'error',
        title: 'Spotify connection failed',
        description: 'Reconnect Spotify to continue the playlist step.',
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
        const res = await fetch('/api/spotify/playlists', { cache: 'no-store' })

        if (res.status === 404) {
          if (!cancelled) {
            setConnected(false)
          }
          return
        }

        if (!res.ok) {
          throw new Error('Spotify playlists could not be loaded.')
        }

        const data = (await res.json()) as { playlists: PlaylistOption[] }

        if (!cancelled) {
          setPlaylists(data.playlists)
        }
      } catch (error) {
        if (!cancelled) {
          setToast({
            open: true,
            tone: 'error',
            title: 'Playlist sync failed',
            description:
              error instanceof Error
                ? error.message
                : 'Spotify playlists could not be loaded right now.',
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

  const selectedPlaylist = useMemo(
    () =>
      playlists.find((playlist) => playlist.id === selectedPlaylistId) ??
      (initialVerification
        ? {
            id: initialVerification.playlistId,
            spotifyPlaylistId: '',
            name: initialVerification.playlistName,
            spotifyUrl: initialVerification.playlistUrl,
            followers: 0,
            trackCount: 0,
            lastSyncedAt: new Date().toISOString(),
          }
        : null),
    [initialVerification, playlists, selectedPlaylistId]
  )

  const verifyReadyAt = snapshot
    ? new Date(snapshot.createdAt).getTime() + VERIFY_DELAY_MS
    : null
  const verifyCountdownMs = verifyReadyAt ? Math.max(0, verifyReadyAt - now) : 0

  const step1Status: StepStatus = selectedPlaylist ? 'complete' : 'active'
  const step2Status: StepStatus = !selectedPlaylist
    ? 'locked'
    : snapshot
      ? 'complete'
      : 'active'
  const step3Status: StepStatus = !snapshot
    ? 'locked'
    : state === 'VERIFYING' || state === 'VERIFY_FAILED'
      ? 'complete'
      : 'active'
  const step4Status: StepStatus = !snapshot
    ? 'locked'
    : state === 'VERIFYING' || state === 'VERIFY_FAILED'
      ? 'active'
      : 'locked'

  function handleSelectPlaylist(playlistId: string) {
    setSelectedPlaylistId(playlistId)
    setVerifyError(null)
  }

  function handleChooseDifferentPlaylist() {
    setSnapshot(null)
    setSelectedPlaylistId('')
    setVerifyError(null)
    setState('PLAYLIST_SELECT')
  }

  async function handleTakeSnapshot() {
    if (!selectedPlaylistId) {
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

      const nextSnapshot = {
        id: data.snapshotId,
        playlistId: selectedPlaylistId,
        createdAt: data.createdAt ?? new Date().toISOString(),
      } satisfies SnapshotState

      setSnapshot(nextSnapshot)
      setVerifyError(null)
      markSnapshotTaken()
      markAwaitingUserAdd()
      setToast({
        open: true,
        tone: 'success',
        title: 'Snapshot saved',
        description: 'Now add the track in Spotify and come back to verify.',
      })
    } catch (error) {
      setToast({
        open: true,
        tone: 'error',
        title: 'Snapshot failed',
        description:
          error instanceof Error
            ? error.message
            : 'The before snapshot could not be created.',
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
    setVerifyError(null)
    markVerifying()

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

      if (!data.verified) {
        markVerifyFailed()
        setVerifyError(
          'Track not found in the playlist yet. Try again in a few seconds.'
        )
        return
      }

      const verifiedState: VerificationState = {
        id: data.verificationId,
        playlistId: selectedPlaylistId,
        playlistName: selectedPlaylist?.name ?? 'Selected playlist',
        playlistUrl: selectedPlaylist?.spotifyUrl ?? null,
        verified: data.verified,
        quality: data.quality,
        verificationType: data.verificationType,
        currentTrackPosition: data.currentTrackPosition ?? null,
        verifiedAt: data.verifiedAt,
        persistenceDueAt: data.persistenceDueAt,
      }

      markVerified()
      onVerified(verifiedState)
      setToast({
        open: true,
        tone: 'success',
        title: 'Playlist add verified',
        description: 'Spotify confirmed the add against the saved snapshot.',
      })
    } catch (error) {
      markVerifyFailed()
      setVerifyError(
        error instanceof Error
          ? error.message
          : 'Track not found in the playlist yet. Try again in a few seconds.'
      )
    } finally {
      setVerifying(false)
    }
  }

  return (
    <>
      <div className={cn('space-y-4', className)}>
        <div className="surface-card p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand-300">
              <TracksIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
                Playlist verification
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">{trackTitle}</h3>
              <p className="mt-1 text-sm text-slate-200">{artistName}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
            <span className="rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-1 text-brand-200">
              Gate 1 complete
            </span>
            <span>→</span>
            <span
              className={cn(
                'rounded-full border px-3 py-1',
                snapshot
                  ? 'border-brand-400/20 bg-brand-500/10 text-brand-200'
                  : 'border-white/10 bg-white/[0.04]'
              )}
            >
              Gate 2 {snapshot ? 'complete' : 'active'}
            </span>
            <span>→</span>
            <span
              className={cn(
                'rounded-full border px-3 py-1',
                state === 'VERIFIED'
                  ? 'border-brand-400/20 bg-brand-500/10 text-brand-200'
                  : 'border-white/10 bg-white/[0.04]'
              )}
            >
              Gate 3 {state === 'VERIFIED' ? 'complete' : 'pending'}
            </span>
          </div>
        </div>

        {!connected && (
          <div className="surface-card p-5">
            <p className="text-sm font-medium text-white">Connect Spotify</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Spotify OAuth is required before SoundSwap can read your playlists
              and verify a real add.
            </p>
            <a href={connectUrl} className="button-primary mt-5 w-full">
              Connect Spotify
              <ArrowUpRightIcon className="h-4 w-4" />
            </a>
          </div>
        )}

        {connected && (
          <div className="space-y-3">
            <StepShell
              stepNumber={1}
              title="Select playlist"
              status={step1Status}
              summary={
                selectedPlaylist
                    ? `${selectedPlaylist.name} - ${selectedPlaylist.trackCount} tracks`
                  : 'Choose the playlist where you plan to add this track.'
              }
            >
              <label htmlFor="playlist-selector" className="sr-only">
                Select a playlist
              </label>
              <select
                id="playlist-selector"
                value={selectedPlaylistId}
                onChange={(event) => handleSelectPlaylist(event.target.value)}
                disabled={loadingPlaylists || Boolean(snapshot)}
                className="h-14 w-full rounded-[1.25rem] border border-white/10 bg-slate-950/85 px-4 text-base text-white outline-none transition focus:border-brand-400/35 focus:ring-2 focus:ring-brand-400/15 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <option value="">Select a playlist</option>
                {playlists.map((playlist) => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.name} - {playlist.trackCount} tracks
                  </option>
                ))}
              </select>

              {selectedPlaylist?.spotifyUrl && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                  <span>{selectedPlaylist.name}</span>
                  <Link
                    href={selectedPlaylist.spotifyUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="button-ghost gap-1 px-0 py-0 text-xs"
                  >
                    Open playlist
                    <ArrowUpRightIcon className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </StepShell>

            <StepShell
              stepNumber={2}
              title="Save a before snapshot"
              status={step2Status}
              summary={
                snapshot
                  ? 'Snapshot saved. The before state is locked in.'
                  : 'Record the playlist before you add anything.'
              }
            >
              <p className="text-sm leading-6 text-slate-400">
                We&apos;ll record your playlist&apos;s current state so SoundSwap can
                detect a real new add.
              </p>
              <button
                type="button"
                onClick={handleTakeSnapshot}
                disabled={submittingSnapshot || !selectedPlaylistId}
                className="button-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-55"
              >
                {submittingSnapshot ? (
                  <>
                    <ClockIcon className="h-4 w-4" />
                    Taking snapshot...
                  </>
                ) : (
                  <>
                    <ClockIcon className="h-4 w-4" />
                    Take Before Snapshot
                  </>
                )}
              </button>
              {selectedPlaylistId && (
                <button
                  type="button"
                  onClick={handleChooseDifferentPlaylist}
                  className="button-secondary mt-3 w-full"
                >
                  Choose different playlist
                </button>
              )}
            </StepShell>

            <StepShell
              stepNumber={3}
              title="Add in Spotify"
              status={step3Status}
              summary={
                snapshot
                  ? 'Open Spotify, add the track, then come back here.'
                  : 'This unlocks after the before snapshot is saved.'
              }
            >
              <div className="space-y-4">
                <div className="rounded-[1.2rem] border border-brand-400/18 bg-brand-500/10 px-4 py-3 text-sm leading-6 text-slate-300">
                  Add <span className="font-medium text-white">{trackTitle}</span> to{' '}
                  <span className="font-medium text-white">
                    {selectedPlaylist?.name ?? 'your selected playlist'}
                  </span>{' '}
                  in Spotify first, then run the verification check.
                </div>

                {verifyCountdownMs > 0 && (
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Verify unlocks in {Math.ceil(verifyCountdownMs / 1000)}s
                  </p>
                )}

                <div className="flex flex-col gap-3">
                  {selectedPlaylist?.spotifyUrl && (
                    <Link
                      href={selectedPlaylist.spotifyUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="button-secondary w-full"
                    >
                      Open Playlist in Spotify
                      <ArrowUpRightIcon className="h-4 w-4" />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleChooseDifferentPlaylist}
                    className="button-secondary w-full"
                  >
                    Choose different playlist
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyAdd}
                    disabled={verifying || verifyCountdownMs > 0}
                    className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {verifying ? (
                      <>
                        <SparkIcon className="h-4 w-4" />
                        Verifying...
                      </>
                    ) : (
                      "I've added it - Verify now"
                    )}
                  </button>
                </div>
              </div>
            </StepShell>

            <StepShell
              stepNumber={4}
              title="Verify add"
              status={step4Status}
              summary={
                state === 'VERIFY_FAILED'
                  ? 'Spotify has not confirmed the add yet.'
                  : 'This unlocks after you save the snapshot and add the track.'
              }
            >
              {verifying ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-[1.2rem] border border-brand-400/20 bg-brand-500/10 px-4 py-4 text-sm text-slate-200">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-400/20 bg-brand-500/12">
                      <SparkIcon className="h-4 w-4 animate-pulse" />
                    </span>
                    Checking your playlist against the before snapshot...
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-[1.2rem] border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-sm leading-6 text-slate-200">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rose-400/20 bg-rose-500/12 text-rose-200">
                        <XIcon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-medium text-white">Verification not ready</p>
                        <p className="mt-1 text-slate-300">
                          {verifyError ??
                            'Track not found in the playlist yet. Try again in a few seconds.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyAdd}
                    className="button-primary w-full"
                  >
                    Try verification again
                  </button>
                  <button
                    type="button"
                    onClick={handleChooseDifferentPlaylist}
                    className="button-secondary w-full"
                  >
                    Choose different playlist
                  </button>
                </div>
              )}
            </StepShell>
          </div>
        )}
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
