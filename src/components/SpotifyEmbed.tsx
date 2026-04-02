'use client'

import { useEffect, useRef } from 'react'

interface PlaybackState {
  isPlaying: boolean
  position: number  // seconds — used by parent to detect forward seeks
}

interface Props {
  trackId: string
  onPlaybackUpdate: (state: PlaybackState) => void
}

/**
 * Renders the Spotify embed iframe and listens for postMessage playback events.
 *
 * The Spotify embed fires `playback_update` messages to the parent window
 * containing isPaused and position. We forward these so the parent can:
 *   1. Drive the play/pause state for the timer
 *   2. Detect forward seeks (position jump > threshold → reset timer)
 */
export default function SpotifyEmbed({ trackId, onPlaybackUpdate }: Props) {
  const callbackRef = useRef(onPlaybackUpdate)
  callbackRef.current = onPlaybackUpdate

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== 'https://open.spotify.com') return

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

        // Primary format: { type: "playback_update", payload: { isPaused, position, duration } }
        if (data?.type === 'playback_update' && data.payload) {
          callbackRef.current({
            isPlaying: !data.payload.isPaused,
            position: data.payload.position ?? 0,
          })
          return
        }

        // Fallback format: { isPaused, position }
        if (typeof data?.isPaused === 'boolean') {
          callbackRef.current({
            isPlaying: !data.isPaused,
            position: data.position ?? 0,
          })
        }
      } catch {
        // Ignore unparseable messages
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const embedUrl = `https://open.spotify.com/embed/track/${trackId}`

  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <iframe
        src={embedUrl}
        width="100%"
        height="352"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Spotify track player"
        className="block"
      />
    </div>
  )
}
