'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GENRES } from '@/lib/genres'
import { cn } from '@/lib/cn'
import StatusToast from '@/components/StatusToast'
import { SPOTIFY_PLAYLIST_URL_REGEX } from '@/lib/spotify'

interface PlaylistEntry {
  url: string
  genres: string[]
}

interface PlaylistError {
  url: string
  status: 'failed_private' | 'failed_ownership' | 'failed_threshold'
  error: string | null
}

interface Props {
  existingApplication: {
    status: 'pending' | 'approved' | 'rejected'
    appliedAt: string
    rejectionReason: string | null
    reviewedBy: string | null
  } | null
  spotifyConnected: boolean
}

const MAX_PLAYLISTS = 10

function emptyEntry(): PlaylistEntry {
  return { url: '', genres: [] }
}

export default function CuratorApplicationForm({
  existingApplication,
  spotifyConnected,
}: Props) {
  const router = useRouter()
  const [playlists, setPlaylists] = useState<PlaylistEntry[]>([emptyEntry()])
  const [playlistErrors, setPlaylistErrors] = useState<PlaylistError[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{
    open: boolean
    tone: 'error' | 'info'
    title: string
    description?: string
  }>({ open: false, tone: 'info', title: '' })

  // ─── Status states ──────────────────────────────────────────────────────────

  if (existingApplication?.status === 'approved') {
    return (
      <div className="surface-card p-8 text-center">
        <h2 className="text-2xl font-black text-white">You&apos;re a curator!</h2>
        <p className="mt-2 text-sm text-white/50">
          Your profile is live. Toggle to curator mode in the dashboard to start reviewing tracks.
        </p>
        <button onClick={() => router.push('/dashboard')} className="button-primary mt-6">
          Go to dashboard
        </button>
      </div>
    )
  }

  if (existingApplication?.status === 'pending') {
    const appliedDate = new Date(existingApplication.appliedAt).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    })
    return (
      <div className="surface-card p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-acid/10 text-acid">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          <div>
            <h2 className="text-lg font-bold text-white">Application under review</h2>
            <p className="mt-1 text-sm text-white/50">Submitted {appliedDate}</p>
            <p className="mt-3 text-sm text-white/40">
              We review applications manually and aim to respond within 5–7 business days.
              You&apos;ll get an email when a decision is made.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (existingApplication?.status === 'rejected') {
    return (
      <div className="space-y-6">
        <div className="surface-card p-6">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-rose-400">
            Application not approved
          </p>
          <p className="mt-2 text-sm text-white/60">
            {existingApplication.rejectionReason ?? 'Your application was not approved at this time.'}
          </p>
        </div>
        <ApplicationForm
          playlists={playlists}
          setPlaylists={setPlaylists}
          playlistErrors={playlistErrors}
          spotifyConnected={spotifyConnected}
          loading={loading}
          onSubmit={handleSubmit}
          submitLabel="Reapply"
        />
      </div>
    )
  }

  // ─── Fresh form ─────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setPlaylistErrors([])
    setLoading(true)

    try {
      const res = await fetch('/api/curator/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlists: playlists.map((p) => ({
            spotifyPlaylistUrl: p.url,
            genres: p.genres,
          })),
        }),
      })

      const data = await res.json()

      if (res.status === 422 && data.playlistErrors) {
        setPlaylistErrors(data.playlistErrors as PlaylistError[])
        setToast({ open: true, tone: 'error', title: data.error ?? 'Some playlists failed verification' })
        return
      }

      if (!res.ok) {
        setToast({ open: true, tone: 'error', title: data.error ?? 'Something went wrong' })
        return
      }

      router.refresh()
    } catch {
      setToast({ open: true, tone: 'error', title: 'Network error — please try again' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <ApplicationForm
        playlists={playlists}
        setPlaylists={setPlaylists}
        playlistErrors={playlistErrors}
        spotifyConnected={spotifyConnected}
        loading={loading}
        onSubmit={handleSubmit}
        submitLabel="Submit application"
      />
      <StatusToast
        open={toast.open}
        tone={toast.tone}
        title={toast.title}
        description={toast.description}
        onClose={() => setToast((c) => ({ ...c, open: false }))}
      />
    </>
  )
}

// ─── Multi-playlist form ───────────────────────────────────────────────────────

function ApplicationForm({
  playlists,
  setPlaylists,
  playlistErrors,
  spotifyConnected,
  loading,
  onSubmit,
  submitLabel,
}: {
  playlists: PlaylistEntry[]
  setPlaylists: (v: PlaylistEntry[]) => void
  playlistErrors: PlaylistError[]
  spotifyConnected: boolean
  loading: boolean
  onSubmit: () => void
  submitLabel: string
}) {
  const allUrlsValid = playlists.every((p) => SPOTIFY_PLAYLIST_URL_REGEX.test(p.url))
  const allGenresSelected = playlists.every((p) => p.genres.length >= 1)
  const canSubmit = spotifyConnected && allUrlsValid && allGenresSelected && playlists.length >= 1

  function updateEntry(index: number, patch: Partial<PlaylistEntry>) {
    const next = [...playlists]
    next[index] = { ...next[index], ...patch }
    setPlaylists(next)
  }

  function addPlaylist() {
    if (playlists.length < MAX_PLAYLISTS) {
      setPlaylists([...playlists, emptyEntry()])
    }
  }

  function removePlaylist(index: number) {
    setPlaylists(playlists.filter((_, i) => i !== index))
  }

  function toggleGenre(index: number, genre: string) {
    const current = playlists[index].genres
    if (current.includes(genre)) {
      updateEntry(index, { genres: current.filter((g) => g !== genre) })
    } else if (current.length < 2) {
      updateEntry(index, { genres: [...current, genre] })
    }
  }

  function getPlaylistError(url: string): string | null {
    return playlistErrors.find((e) => e.url === url)?.error ?? null
  }

  return (
    <div className="space-y-8">
      {/* Spotify connect gate */}
      {!spotifyConnected && (
        <div className="surface-card p-6">
          <p className="text-sm font-medium text-white">Connect Spotify first</p>
          <p className="mt-2 text-sm text-white/50">
            We verify playlist ownership using your Spotify account. Connect before applying.
          </p>
          <a href="/api/spotify/login?returnTo=/apply-curator" className="button-primary mt-5 inline-flex">
            Connect Spotify
          </a>
        </div>
      )}

      {/* Playlist entries */}
      {playlists.map((entry, idx) => {
        const urlValid = SPOTIFY_PLAYLIST_URL_REGEX.test(entry.url)
        const serverError = getPlaylistError(entry.url)

        return (
          <div key={idx} className="surface-card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                Playlist {playlists.length > 1 ? idx + 1 : ''}
              </p>
              {playlists.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePlaylist(idx)}
                  className="text-xs text-white/30 hover:text-rose-400 transition"
                >
                  Remove
                </button>
              )}
            </div>

            {/* URL */}
            <div>
              <label className="block text-xs font-medium text-white/60">
                Spotify playlist URL
              </label>
              <p className="mt-0.5 text-[0.65rem] text-white/30">
                Must be public and owned by you (or a collaborative playlist).
              </p>
              <input
                type="url"
                value={entry.url}
                onChange={(e) => updateEntry(idx, { url: e.target.value })}
                placeholder="https://open.spotify.com/playlist/..."
                className={cn(
                  'mt-2 h-11 w-full rounded-xl border bg-[#111111] px-4 text-sm text-white transition focus:outline-none focus:ring-2',
                  entry.url && !urlValid
                    ? 'border-rose-400/40 focus:ring-rose-400/20'
                    : serverError
                      ? 'border-rose-400/40 focus:ring-rose-400/20'
                      : 'border-white/10 focus:border-acid/40 focus:ring-acid/15'
                )}
              />
              {entry.url && !urlValid && (
                <p className="mt-1.5 text-xs text-rose-400">
                  That doesn&apos;t look like a Spotify playlist URL.
                </p>
              )}
              {serverError && urlValid && (
                <p className="mt-1.5 text-xs text-rose-400">{serverError}</p>
              )}
            </div>

            {/* Genre picker */}
            <div>
              <label className="block text-xs font-medium text-white/60">
                Genre focus <span className="text-white/30">(up to 2)</span>
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {GENRES.map((genre) => {
                  const selected = entry.genres.includes(genre)
                  const disabled = !selected && entry.genres.length >= 2
                  return (
                    <button
                      key={genre}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleGenre(idx, genre)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                        selected
                          ? 'border-acid/40 bg-acid/10 text-acid'
                          : disabled
                            ? 'cursor-not-allowed border-white/5 text-white/20'
                            : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/80'
                      )}
                    >
                      {genre}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}

      {/* Add another playlist */}
      {playlists.length < MAX_PLAYLISTS && (
        <button
          type="button"
          onClick={addPlaylist}
          className="w-full rounded-xl border border-dashed border-white/15 py-3 text-sm text-white/40 transition hover:border-white/25 hover:text-white/60"
        >
          + Add another playlist
        </button>
      )}

      <button
        type="button"
        disabled={!canSubmit || loading}
        onClick={onSubmit}
        className={cn(
          'button-primary w-full',
          (!canSubmit || loading) && 'cursor-not-allowed opacity-50'
        )}
      >
        {loading ? 'Verifying playlists...' : submitLabel}
      </button>
    </div>
  )
}
