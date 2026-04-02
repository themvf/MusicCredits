'use client'

import { useEffect, useRef } from 'react'

interface Props {
  trackId: string
  onPlayStateChange: (isPlaying: boolean) => void
}

/**
 * Renders the Spotify embed iframe and listens for postMessage playback events.
 *
 * The Spotify embed iframe sends playback_update messages to the parent window
 * via postMessage without needing the IFrame API script. We listen for these
 * to get real play/pause state.
 *
 * If Spotify changes their message format, the fallback is the manual timer
 * button which is still the server-side enforced path anyway.
 */
export default function SpotifyEmbed({ trackId, onPlayStateChange }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const onPlayStateChangeRef = useRef(onPlayStateChange)
  onPlayStateChangeRef.current = onPlayStateChange

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Only accept messages from Spotify's embed domain
      if (event.origin !== 'https://open.spotify.com') return

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

        // Spotify embed sends playback_update with isPaused field
        if (data?.type === 'playback_update') {
          onPlayStateChangeRef.current(!data.payload?.isPaused)
          return
        }

        // Some versions use a different shape
        if (typeof data?.isPaused === 'boolean') {
          onPlayStateChangeRef.current(!data.isPaused)
        }
      } catch {
        // Ignore unparseable messages from other iframes
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const embedUrl = `https://open.spotify.com/embed/track/${trackId}`

  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      <iframe
        ref={iframeRef}
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
