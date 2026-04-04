'use client'

import { useEffect, useRef } from 'react'
import { HeadphonesIcon, WaveformIcon } from '@/components/AppIcons'

interface PlaybackState {
  isPlaying: boolean
  position: number
}

interface SpotifyEmbedProps {
  trackId: string
  onPlaybackUpdate: (state: PlaybackState) => void
}

export default function SpotifyEmbed({
  trackId,
  onPlaybackUpdate,
}: SpotifyEmbedProps) {
  const callbackRef = useRef(onPlaybackUpdate)
  callbackRef.current = onPlaybackUpdate

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== 'https://open.spotify.com') return

      try {
        const data =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data

        if (data?.type === 'playback_update' && data.payload) {
          callbackRef.current({
            isPlaying: !data.payload.isPaused,
            position: data.payload.position ?? 0,
          })
          return
        }

        if (typeof data?.isPaused === 'boolean') {
          callbackRef.current({
            isPlaying: !data.isPaused,
            position: data.position ?? 0,
          })
        }
      } catch {
        return
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div className="surface-card overflow-hidden p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">Spotify player</p>
          <p className="text-sm leading-6 text-slate-400">
            Start playback here to move the SoundSwap timer.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-slate-500">
          <HeadphonesIcon className="h-3.5 w-3.5" />
          Synced session
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/70">
        <iframe
          src={`https://open.spotify.com/embed/track/${trackId}`}
          width="100%"
          height="352"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify track player"
          className="block"
        />
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
        <WaveformIcon className="h-3.5 w-3.5" />
        Forward seeks or pauses reset the timer.
      </div>
    </div>
  )
}
