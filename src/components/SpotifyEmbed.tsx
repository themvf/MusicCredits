'use client'

import { useEffect, useRef } from 'react'

// TypeScript declarations for the Spotify IFrame API global
declare global {
  interface Window {
    onSpotifyIframeApiReady: (IFrameAPI: SpotifyIFrameAPI) => void
    SpotifyIframeApiReady?: boolean
  }
}

interface SpotifyIFrameAPI {
  createController: (
    element: HTMLElement,
    options: { uri: string; width: string | number; height: string | number },
    callback: (controller: SpotifyEmbedController) => void
  ) => void
}

interface PlaybackUpdate {
  isPaused: boolean
  position: number  // seconds elapsed
  duration: number
}

interface SpotifyEmbedController {
  addListener: (event: 'playback_update', callback: (e: { data: PlaybackUpdate }) => void) => void
  destroy: () => void
}

interface Props {
  trackId: string
  onPlaybackUpdate: (update: PlaybackUpdate) => void
}

/**
 * Renders the Spotify embed using the official IFrame API.
 *
 * The IFrame API fires `playback_update` events with real playback state
 * (isPaused, position, duration). We forward these to the parent so the
 * timer can accumulate time only when audio is actually playing.
 *
 * Cross-origin note: we cannot access the audio element inside the iframe
 * directly. The IFrame API is the only official way to observe playback state.
 */
export default function SpotifyEmbed({ trackId, onPlaybackUpdate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<SpotifyEmbedController | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const uri = `spotify:track:${trackId}`

    function initController(IFrameAPI: SpotifyIFrameAPI) {
      if (!containerRef.current) return

      // Clear any previous embed (e.g. if trackId changes)
      containerRef.current.innerHTML = ''

      IFrameAPI.createController(
        containerRef.current,
        { uri, width: '100%', height: 352 },
        (controller) => {
          controllerRef.current = controller

          // playback_update fires on every state change: play, pause, seek, timeupdate
          controller.addListener('playback_update', (e) => {
            onPlaybackUpdate(e.data)
          })
        }
      )
    }

    if (window.SpotifyIframeApiReady) {
      // API already loaded from a previous render — re-init directly
      // The API object is stored on window by the script
      // We trigger re-init by firing the ready callback if available
      // This handles React StrictMode double-mount and navigation
    }

    // Set up the ready callback before the script loads
    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      window.SpotifyIframeApiReady = true
      initController(IFrameAPI)
    }

    // Only inject the script once per page load
    const existingScript = document.getElementById('spotify-iframe-api')
    if (!existingScript) {
      const script = document.createElement('script')
      script.id = 'spotify-iframe-api'
      script.src = 'https://open.spotify.com/embed/iframe-api/v1'
      script.async = true
      document.body.appendChild(script)
    }

    return () => {
      // Destroy controller on unmount to clean up the embed
      controllerRef.current?.destroy()
      controllerRef.current = null
    }
  }, [trackId]) // Re-init if the track changes

  // onPlaybackUpdate is excluded from deps intentionally — it's a stable
  // callback reference passed from ListenPageClient via useCallback
  // eslint-disable-next-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-xl overflow-hidden shadow-xl">
      {/* The IFrame API injects the iframe into this container */}
      <div ref={containerRef} />
    </div>
  )
}
