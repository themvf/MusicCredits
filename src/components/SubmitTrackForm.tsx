'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BoltIcon, SparkIcon, UploadIcon, WaveformIcon } from '@/components/AppIcons'
import StatusToast from '@/components/StatusToast'
import {
  extractSpotifyTrackId,
  getSpotifyTrackLabel,
  getSpotifyTrackReference,
  SPOTIFY_TRACK_URL_REGEX,
} from '@/lib/spotify'

interface SubmitTrackFormProps {
  credits: number
}

export default function SubmitTrackForm({ credits }: SubmitTrackFormProps) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
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

  const previewTrackId = extractSpotifyTrackId(url)
  const isValidFormat = SPOTIFY_TRACK_URL_REGEX.test(url)
  const canSubmit = credits >= 10 && isValidFormat && !loading

  const previewLabel = previewTrackId
    ? getSpotifyTrackLabel(url)
    : 'Track preview'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setLoading(true)

    try {
      const res = await fetch('/api/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotifyUrl: url.trim() }),
      })

      if (res.status === 402) {
        setToast({
          open: true,
          tone: 'error',
          title: 'Not enough credits',
          description: 'Listen to a few tracks first, then come back to submit.',
        })
        setLoading(false)
        return
      }

      if (res.status === 400) {
        const body = await res.json()
        setToast({
          open: true,
          tone: 'error',
          title: 'Invalid Spotify URL',
          description: body.error || 'Paste a valid Spotify track URL to continue.',
        })
        setLoading(false)
        return
      }

      if (!res.ok) {
        setToast({
          open: true,
          tone: 'error',
          title: 'Submission failed',
          description: 'The queue could not be updated. Please try again.',
        })
        setLoading(false)
        return
      }

      setToast({
        open: true,
        tone: 'success',
        title: 'Track submitted',
        description: 'Your song is now in the queue and ready for discovery.',
      })

      window.setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 800)
    } catch {
      setToast({
        open: true,
        tone: 'error',
        title: 'Network error',
        description: 'Please retry once your connection is stable.',
      })
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="surface-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Spotify track URL</p>
              <p className="text-sm leading-6 text-slate-400">
                Paste a direct Spotify track link. The campaign will cost 10
                credits when it enters the queue.
              </p>
            </div>
            <span className="eyebrow-badge px-3 py-1.5 normal-case tracking-[0.18em]">
              <UploadIcon className="h-4 w-4" />
              Ready to queue
            </span>
          </div>

          <div className="mt-5">
            <label htmlFor="spotifyUrl" className="sr-only">
              Spotify Track URL
            </label>
            <input
              id="spotifyUrl"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://open.spotify.com/track/..."
              disabled={loading}
              aria-invalid={url.length > 0 && !isValidFormat}
              className="h-14 w-full rounded-[1.3rem] border border-white/10 bg-slate-950/80 px-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-brand-400/40 focus:ring-2 focus:ring-brand-400/15 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {url && !isValidFormat && (
              <p className="text-rose-300">
                Use a full Spotify track URL. Album or playlist links will not work.
              </p>
            )}
            {previewTrackId && (
              <p className="text-brand-300">
                Track detected. Submission will leave you with {Math.max(credits - 10, 0)} credits.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="surface-card-soft p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand-300">
                <WaveformIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-white">Submission preview</p>
                <p className="text-sm text-slate-400">
                  This is how your track is staged before it goes live.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
              {previewTrackId ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {previewLabel}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {getSpotifyTrackReference(url)}
                      </p>
                    </div>
                    <span className="rounded-full border border-brand-400/15 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
                      Verified URL
                    </span>
                  </div>

                  <div className="flex h-14 items-end gap-2">
                    {[28, 44, 62, 38, 70, 54, 80].map((height, index) => (
                      <span
                        key={height}
                        className="animate-pulse-line w-full rounded-full bg-[linear-gradient(180deg,rgba(34,197,94,0.9),rgba(59,130,246,0.35))]"
                        style={{
                          height: `${height}%`,
                          animationDelay: `${index * 120}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-lg font-semibold text-white">Track preview</p>
                  <p className="text-sm leading-6 text-slate-400">
                    Paste a Spotify URL to preview how the campaign will be queued.
                  </p>
                </div>
              )}
            </div>
          </div>

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

            <div className="mt-6 space-y-4 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Current credits</span>
                <span className="text-white">{credits}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Queue cost</span>
                <span className="text-white">10</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm text-slate-400">
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
              {loading ? (
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
          </div>
        </div>
      </form>

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
