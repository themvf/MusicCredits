'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BoltIcon, SparkIcon, UploadIcon } from '@/components/AppIcons'
import StatusToast from '@/components/StatusToast'
import { extractSpotifyTrackId, SPOTIFY_TRACK_URL_REGEX } from '@/lib/spotify'
import { GENRES } from '@/lib/genres'

const MOODS = [
  'Energetic',
  'Hype',
  'Happy',
  'Romantic',
  'Chill',
  'Melancholic',
  'Dark',
  'Aggressive',
  'Motivational',
  'Dreamy',
  'Nostalgic',
  'Spiritual',
  'Sexy',
  'Angry',
  'Peaceful',
]

const REGIONS = [
  'Global',
  'North America',
  'Europe',
  'Latin America',
  'Africa',
  'Asia-Pacific',
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrackPreview {
  title: string
  artistName: string
  artworkUrl: string | null
  durationMs: number
  bpm: number | null
  explicit: boolean
  releaseDate: string | null
}

interface SoundsLikeArtist {
  id: string
  name: string
  genres: string[]
  followers: number
  imageUrl: string | null
}

interface ArtistSearchResult {
  id: string
  name: string
  genres: string[]
  followers: number
  imageUrl: string | null
}

interface SubmitTrackFormProps {
  credits: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function QuestionLabel({
  number,
  label,
  hint,
  optional,
}: {
  number: string
  label: string
  hint?: string
  optional?: boolean
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs font-semibold text-slate-400">
        {number}
      </span>
      <div>
        <p className="text-sm font-medium text-white">
          {label}
          {optional && (
            <span className="ml-2 text-xs font-normal text-slate-500">optional</span>
          )}
        </p>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  )
}

function PillButton({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string
  selected: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        selected
          ? 'border-brand-400/40 bg-brand-500/20 text-brand-300'
          : 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:text-white',
        disabled ? 'cursor-not-allowed opacity-40' : '',
      ]
        .join(' ')
        .trim()}
    >
      {label}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SubmitTrackForm({ credits }: SubmitTrackFormProps) {
  const router = useRouter()

  // Q1 — Spotify URL
  const [url, setUrl] = useState('')
  const [trackPreview, setTrackPreview] = useState<TrackPreview | null>(null)
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  // Q2 — Genres
  const [genres, setGenres] = useState<string[]>([])

  // Q3 — Moods
  const [moods, setMoods] = useState<string[]>([])

  // Q4 — Sounds like
  const [soundsLikeArtists, setSoundsLikeArtists] = useState<SoundsLikeArtist[]>([])
  const [artistQuery, setArtistQuery] = useState('')
  const [artistResults, setArtistResults] = useState<ArtistSearchResult[]>([])
  const [artistSearchLoading, setArtistSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const artistDropdownRef = useRef<HTMLDivElement>(null)

  // Q5 — Story
  const [story, setStory] = useState('')

  // Q6 — Region
  const [targetRegion, setTargetRegion] = useState('')

  // Submit
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{
    open: boolean
    tone: 'success' | 'error'
    title: string
    description?: string
  }>({ open: false, tone: 'success', title: '' })

  // ── Q1: fetch preview when track ID changes ─────────────────────────────
  const trackId = extractSpotifyTrackId(url)

  useEffect(() => {
    if (!trackId) {
      setTrackPreview(null)
      setPreviewStatus('idle')
      return
    }

    setPreviewStatus('loading')
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/spotify/track?id=${trackId}`)
        if (!res.ok) {
          setPreviewStatus('error')
          setTrackPreview(null)
          return
        }
        const data: TrackPreview = await res.json()
        setTrackPreview(data)
        setPreviewStatus('idle')
      } catch {
        setPreviewStatus('error')
        setTrackPreview(null)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [trackId])

  // ── Q4: debounced artist search ─────────────────────────────────────────
  useEffect(() => {
    if (artistQuery.trim().length < 2) {
      setArtistResults([])
      setShowDropdown(false)
      return
    }

    setArtistSearchLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/spotify/artist-search?q=${encodeURIComponent(artistQuery.trim())}`
        )
        if (res.ok) {
          const data: ArtistSearchResult[] = await res.json()
          setArtistResults(data)
          setShowDropdown(true)
        }
      } catch {
        // silent — search is best-effort
      } finally {
        setArtistSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [artistQuery])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        artistDropdownRef.current &&
        !artistDropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Pill toggle helpers ─────────────────────────────────────────────────
  function toggleGenre(genre: string) {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    )
  }

  function toggleMood(mood: string) {
    setMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    )
  }

  function selectArtist(artist: ArtistSearchResult) {
    if (soundsLikeArtists.some((a) => a.id === artist.id)) return
    setSoundsLikeArtists((prev) => [
      ...prev,
      { id: artist.id, name: artist.name, genres: artist.genres, followers: artist.followers, imageUrl: artist.imageUrl },
    ])
    setArtistQuery('')
    setArtistResults([])
    setShowDropdown(false)
  }

  function removeArtist(id: string) {
    setSoundsLikeArtists((prev) => prev.filter((a) => a.id !== id))
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  const urlValid = SPOTIFY_TRACK_URL_REGEX.test(url)
  const canSubmit =
    urlValid &&
    trackPreview !== null &&
    previewStatus !== 'loading' &&
    genres.length >= 1 &&
    moods.length >= 1 &&
    targetRegion !== '' &&
    credits >= 10 &&
    !submitting

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotifyUrl: url.trim(),
          genres,
          moods,
          soundsLikeArtists: soundsLikeArtists.length > 0 ? soundsLikeArtists : undefined,
          story: story.trim() || undefined,
          targetRegion,
        }),
      })

      if (res.status === 402) {
        setToast({ open: true, tone: 'error', title: 'Not enough credits', description: 'Listen to a few tracks first, then come back to submit.' })
        setSubmitting(false)
        return
      }

      if (res.status === 400) {
        const body = await res.json()
        setToast({ open: true, tone: 'error', title: 'Invalid submission', description: body.error ?? 'Check your answers and try again.' })
        setSubmitting(false)
        return
      }

      if (!res.ok) {
        setToast({ open: true, tone: 'error', title: 'Submission failed', description: 'The queue could not be updated. Please try again.' })
        setSubmitting(false)
        return
      }

      setToast({ open: true, tone: 'success', title: 'Track submitted', description: 'Your song is now in the queue and ready for discovery.' })
      window.setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 800)
    } catch {
      setToast({ open: true, tone: 'error', title: 'Network error', description: 'Please retry once your connection is stable.' })
      setSubmitting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Q1 — Spotify track link */}
        <div className="surface-card p-6">
          <QuestionLabel
            number="01"
            label="Spotify track link"
            hint="Paste a direct Spotify track URL. The track info will be pulled automatically."
          />

          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://open.spotify.com/track/..."
            disabled={submitting}
            aria-invalid={url.length > 0 && !urlValid}
            className="h-14 w-full rounded-[1.3rem] border border-white/10 bg-slate-950/80 px-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-brand-400/40 focus:ring-2 focus:ring-brand-400/15 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {/* Validation / loading feedback */}
          <div className="mt-2 min-h-[20px] text-sm">
            {url && !urlValid && (
              <p className="text-rose-300">Use a full Spotify track URL — album or playlist links won&apos;t work.</p>
            )}
            {urlValid && previewStatus === 'loading' && (
              <p className="text-slate-400">Looking up track...</p>
            )}
            {urlValid && previewStatus === 'error' && (
              <p className="text-rose-300">Track not found. Check the URL and try again.</p>
            )}
          </div>

          {/* Track preview card */}
          {trackPreview && previewStatus === 'idle' && (
            <div className="mt-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              {trackPreview.artworkUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={trackPreview.artworkUrl}
                  alt={trackPreview.title}
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                  <svg className="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="2" />
                    <path d="M12 2a10 10 0 0 1 0 20" />
                    <path d="M12 8a4 4 0 0 1 0 8" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-white">{trackPreview.title}</p>
                  {trackPreview.explicit && (
                    <span className="shrink-0 rounded border border-white/20 px-1 py-0.5 text-[10px] font-bold uppercase text-slate-400">E</span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-slate-400">{trackPreview.artistName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDuration(trackPreview.durationMs)}
                  {trackPreview.bpm ? ` · ${trackPreview.bpm} BPM` : ''}
                  {trackPreview.releaseDate ? ` · ${trackPreview.releaseDate.slice(0, 4)}` : ''}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-brand-400/15 bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-300">
                Found
              </span>
            </div>
          )}
        </div>

        {/* Q2 — Primary genre */}
        <div className="surface-card p-6">
          <QuestionLabel
            number="02"
            label="Primary genre"
            hint="Pick up to 2 that best describe the track."
          />
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <PillButton
                key={genre}
                label={genre}
                selected={genres.includes(genre)}
                disabled={genres.length >= 2 && !genres.includes(genre)}
                onClick={() => toggleGenre(genre)}
              />
            ))}
          </div>
          {genres.length === 0 && (
            <p className="mt-3 text-xs text-slate-500">Select at least 1 to continue.</p>
          )}
        </div>

        {/* Q3 — Mood */}
        <div className="surface-card p-6">
          <QuestionLabel
            number="03"
            label="Mood"
            hint="Pick up to 3. This shapes curator matching and charts."
          />
          <div className="flex flex-wrap gap-2">
            {MOODS.map((mood) => (
              <PillButton
                key={mood}
                label={mood}
                selected={moods.includes(mood)}
                disabled={moods.length >= 3 && !moods.includes(mood)}
                onClick={() => toggleMood(mood)}
              />
            ))}
          </div>
          {moods.length === 0 && (
            <p className="mt-3 text-xs text-slate-500">Select at least 1 to continue.</p>
          )}
        </div>

        {/* Q4 — Sounds like */}
        <div className="surface-card p-6">
          <QuestionLabel
            number="04"
            label="Sounds like"
            hint="Search for up to 2 artists this track is influenced by."
            optional
          />

          {/* Selected artists */}
          {soundsLikeArtists.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {soundsLikeArtists.map((artist) => (
                <span
                  key={artist.id}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] pl-3 pr-2 py-1.5 text-sm text-white"
                >
                  {artist.name}
                  <button
                    type="button"
                    onClick={() => removeArtist(artist.id)}
                    aria-label={`Remove ${artist.name}`}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:text-white"
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3" aria-hidden="true">
                      <path d="M4.47 4.47a.75.75 0 0 1 1.06 0L8 6.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L9.06 8l2.47 2.47a.75.75 0 1 1-1.06 1.06L8 9.06l-2.47 2.47a.75.75 0 0 1-1.06-1.06L6.94 8 4.47 5.53a.75.75 0 0 1 0-1.06Z" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search input + dropdown */}
          {soundsLikeArtists.length < 2 && (
            <div className="relative" ref={artistDropdownRef}>
              <div className="relative">
                <svg
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={artistQuery}
                  onChange={(e) => setArtistQuery(e.target.value)}
                  onFocus={() => artistResults.length > 0 && setShowDropdown(true)}
                  placeholder="Search artists..."
                  disabled={submitting}
                  className="h-12 w-full rounded-[1.3rem] border border-white/10 bg-slate-950/80 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-brand-400/40 focus:ring-2 focus:ring-brand-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                />
                {artistSearchLoading && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    Searching...
                  </span>
                )}
              </div>

              {showDropdown && artistResults.length > 0 && (
                <ul className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl">
                  {artistResults.map((artist) => {
                    const primaryGenre = artist.genres[0] ?? null
                    const alreadySelected = soundsLikeArtists.some((a) => a.id === artist.id)
                    return (
                      <li key={artist.id}>
                        <button
                          type="button"
                          onClick={() => selectArtist(artist)}
                          disabled={alreadySelected}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {artist.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={artist.imageUrl}
                              alt={artist.name}
                              width={36}
                              height={36}
                              className="h-9 w-9 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-500">
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <circle cx="12" cy="8" r="4" />
                                <path d="M20 21a8 8 0 1 0-16 0" />
                              </svg>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">{artist.name}</p>
                            {primaryGenre && (
                              <p className="truncate text-xs capitalize text-slate-400">{primaryGenre}</p>
                            )}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Q5 — Track story */}
        <div className="surface-card p-6">
          <QuestionLabel
            number="05"
            label="In one sentence, what is this track about or what inspired it?"
            optional
          />
          <div className="relative">
            <input
              type="text"
              value={story}
              onChange={(e) => setStory(e.target.value.slice(0, 120))}
              placeholder="e.g. A late-night drive through the city after a breakup."
              disabled={submitting}
              className="h-12 w-full rounded-[1.3rem] border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-brand-400/40 focus:ring-2 focus:ring-brand-400/15 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <span
              className={[
                'pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs tabular-nums',
                story.length >= 110 ? 'text-amber-400' : 'text-slate-500',
              ].join(' ')}
            >
              {story.length}/120
            </span>
          </div>
          {story.length === 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Tracks with a story get more curator attention.
            </p>
          )}
        </div>

        {/* Q6 — Target region */}
        <div className="surface-card p-6">
          <QuestionLabel
            number="06"
            label="Target audience region"
            hint="Drives curator routing by playlist geography."
          />
          <div className="relative">
            <select
              value={targetRegion}
              onChange={(e) => setTargetRegion(e.target.value)}
              disabled={submitting}
              className="h-12 w-full appearance-none rounded-[1.3rem] border border-white/10 bg-slate-950/80 px-4 pr-10 text-sm text-white outline-none transition focus:border-brand-400/40 focus:ring-2 focus:ring-brand-400/15 disabled:cursor-not-allowed disabled:opacity-60 [&>option]:bg-slate-900"
            >
              <option value="" disabled>
                Select a region...
              </option>
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* Credit cost + submit */}
        <div className="surface-card-soft p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand-300">
              <BoltIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-white">Credit cost</p>
              <p className="text-sm text-slate-400">
                Promotion is funded directly from your earned balance.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Current credits</span>
              <span className="text-white">{credits}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Queue cost</span>
              <span className="text-white">10</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-sm text-slate-400">
              <span>Balance after submit</span>
              <span className="text-lg font-semibold text-white">
                {Math.max(credits - 10, 0)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="button-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <SparkIcon className="h-4 w-4" />
                Submitting...
              </>
            ) : (
              <>
                <UploadIcon className="h-4 w-4" />
                Submit Track
              </>
            )}
          </button>

          {credits < 10 && (
            <p className="mt-3 text-center text-xs text-slate-500">
              You need at least 10 credits. Listen to tracks to earn more.
            </p>
          )}
        </div>
      </form>

      <StatusToast
        open={toast.open}
        tone={toast.tone}
        title={toast.title}
        description={toast.description}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </>
  )
}
