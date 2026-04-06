'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GENRES } from '@/lib/genres'
import { cn } from '@/lib/cn'
import StatusToast from '@/components/StatusToast'
import { SPOTIFY_PLAYLIST_URL_REGEX } from '@/lib/spotify'

interface Props {
  // null = no prior application, show the form
  existingApplication: {
    status: 'pending' | 'approved' | 'rejected'
    appliedAt: string
    rejectionReason: string | null
    reviewedBy: string | null   // null = auto-rejection
    cooldownEndsAt: string | null
  } | null
}

export default function CuratorApplicationForm({ existingApplication }: Props) {
  const router = useRouter()

  const [playlistUrl, setPlaylistUrl] = useState('')
  const [genres, setGenres] = useState<string[]>([])
  const [motivation, setMotivation] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{
    open: boolean
    tone: 'error' | 'info' | 'success'
    title: string
    description?: string
  }>({ open: false, tone: 'info', title: '' })

  // ─── Status states ──────────────────────────────────────────────────────────

  if (existingApplication?.status === 'approved') {
    return (
      <div className="surface-card p-8 text-center">
        <p className="text-5xl">🎉</p>
        <h2 className="mt-4 text-2xl font-black text-white">You&apos;re a curator!</h2>
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
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    return (
      <div className="surface-card p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-acid/10 text-acid">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
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
    const isAutoRejection = !existingApplication.reviewedBy
    const cooldownActive =
      existingApplication.cooldownEndsAt &&
      new Date(existingApplication.cooldownEndsAt) > new Date()

    const daysLeft = existingApplication.cooldownEndsAt
      ? Math.ceil(
          (new Date(existingApplication.cooldownEndsAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      : 0

    return (
      <div className="space-y-6">
        <div className="surface-card p-6">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-rose-400">
            Application not approved
          </p>
          <p className="mt-2 text-sm text-white/60">
            {existingApplication.rejectionReason ?? 'Your application was not approved at this time.'}
          </p>
          {cooldownActive && (
            <p className="mt-3 text-xs text-white/40">
              You can reapply in {daysLeft} day{daysLeft === 1 ? '' : 's'}.
            </p>
          )}
        </div>

        {(isAutoRejection || !cooldownActive) && (
          <ApplicationFormFields
            playlistUrl={playlistUrl}
            setPlaylistUrl={setPlaylistUrl}
            genres={genres}
            setGenres={setGenres}
            motivation={motivation}
            setMotivation={setMotivation}
            loading={loading}
            onSubmit={handleSubmit}
            submitLabel="Reapply"
          />
        )}
      </div>
    )
  }

  // ─── Fresh form ─────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!playlistUrl || genres.length === 0 || motivation.trim().length < 10) return
    setLoading(true)

    try {
      const res = await fetch('/api/curator/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotifyPlaylistUrl: playlistUrl, genres, motivation }),
      })

      const data = await res.json()

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
      <ApplicationFormFields
        playlistUrl={playlistUrl}
        setPlaylistUrl={setPlaylistUrl}
        genres={genres}
        setGenres={setGenres}
        motivation={motivation}
        setMotivation={setMotivation}
        loading={loading}
        onSubmit={handleSubmit}
        submitLabel="Submit application"
      />
      <StatusToast
        open={toast.open}
        tone={toast.tone === 'success' ? 'info' : toast.tone}
        title={toast.title}
        description={toast.description}
        onClose={() => setToast((c) => ({ ...c, open: false }))}
      />
    </>
  )
}

// ─── Shared form fields component ─────────────────────────────────────────────

function ApplicationFormFields({
  playlistUrl,
  setPlaylistUrl,
  genres,
  setGenres,
  motivation,
  setMotivation,
  loading,
  onSubmit,
  submitLabel,
}: {
  playlistUrl: string
  setPlaylistUrl: (v: string) => void
  genres: string[]
  setGenres: (v: string[]) => void
  motivation: string
  setMotivation: (v: string) => void
  loading: boolean
  onSubmit: () => void
  submitLabel: string
}) {
  const urlValid = SPOTIFY_PLAYLIST_URL_REGEX.test(playlistUrl)
  const canSubmit =
    urlValid &&
    genres.length >= 1 &&
    motivation.trim().length >= 10 &&
    motivation.length <= 150

  function toggleGenre(genre: string) {
    if (genres.includes(genre)) {
      setGenres(genres.filter((g) => g !== genre))
    } else if (genres.length < 2) {
      setGenres([...genres, genre])
    }
  }

  return (
    <div className="space-y-8">
      {/* Q1: Playlist URL */}
      <div className="surface-card p-6">
        <label className="block text-sm font-medium text-white/60">
          Spotify playlist URL
        </label>
        <p className="mt-1 text-xs text-white/30">
          Must be a public playlist. Paste the full URL from Spotify.
        </p>
        <input
          type="url"
          value={playlistUrl}
          onChange={(e) => setPlaylistUrl(e.target.value)}
          placeholder="https://open.spotify.com/playlist/..."
          className={cn(
            'mt-3 h-11 w-full rounded-xl border bg-[#111111] px-4 text-sm text-white transition focus:outline-none focus:ring-2',
            playlistUrl && !urlValid
              ? 'border-rose-400/40 focus:ring-rose-400/20'
              : 'border-white/10 focus:border-acid/40 focus:ring-acid/15'
          )}
        />
        {playlistUrl && !urlValid && (
          <p className="mt-2 text-xs text-rose-400">
            That doesn&apos;t look like a Spotify playlist URL.
          </p>
        )}
      </div>

      {/* Q2: Genre focus */}
      <div className="surface-card p-6">
        <label className="block text-sm font-medium text-white/60">
          Genre focus{' '}
          <span className="text-white/30">(up to 2)</span>
        </label>
        <p className="mt-1 text-xs text-white/30">
          What genres does your playlist cover?
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {GENRES.map((genre) => {
            const selected = genres.includes(genre)
            const disabled = !selected && genres.length >= 2
            return (
              <button
                key={genre}
                type="button"
                disabled={disabled}
                onClick={() => toggleGenre(genre)}
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

      {/* Q3: Motivation */}
      <div className="surface-card p-6">
        <label className="block text-sm font-medium text-white/60">
          Why do you curate?
        </label>
        <p className="mt-1 text-xs text-white/30">
          What makes a track earn a spot on your playlist? (10–150 characters)
        </p>
        <textarea
          rows={3}
          maxLength={150}
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          placeholder="I curate tracks that..."
          className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white transition focus:border-acid/40 focus:outline-none focus:ring-2 focus:ring-acid/15"
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className={cn(
            motivation.trim().length > 0 && motivation.trim().length < 10
              ? 'text-rose-400'
              : 'text-white/20'
          )}>
            {motivation.trim().length < 10
              ? `${10 - motivation.trim().length} more characters needed`
              : null}
          </span>
          <span className={cn('text-white/30', motivation.length > 140 && 'text-rose-400')}>
            {motivation.length} / 150
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled={!canSubmit || loading}
        onClick={onSubmit}
        className={cn(
          'button-primary w-full',
          (!canSubmit || loading) && 'cursor-not-allowed opacity-50'
        )}
      >
        {loading ? 'Checking your playlist...' : submitLabel}
      </button>
    </div>
  )
}
