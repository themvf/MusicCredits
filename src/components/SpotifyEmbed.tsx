'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    onSpotifyIframeApiReady: (IFrameAPI: SpotifyIFrameAPI) => void
    _spotifyIFrameAPI?: SpotifyIFrameAPI
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
  position: number
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
 * Handles two cases:
 *   1. First load — injects the script, waits for onSpotifyIframeApiReady
 *   2. Re-render / navigation — script already loaded, API stored on window,
 *      call createController immediately without waiting for the callback
 */
export default function SpotifyEmbed({ trackId, onPlaybackUpdate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<SpotifyEmbedController | null>(null)
  // Keep a ref to the latest callback to avoid stale closures
  const callbackRef = useRef(onPlaybackUpdate)
  callbackRef.current = onPlaybackUpdate

  useEffect(() => {
    if (!containerRef.current) return

    const uri = `spotify:track:${trackId}`

    function createController(IFrameAPI: SpotifyIFrameAPI) {
      if (!containerRef.current) return

      // Destroy previous controller if trackId changed
      controllerRef.current?.destroy()
      controllerRef.current = null
      containerRef.current.innerHTML = ''

      IFrameAPI.createController(
        containerRef.current,
        { uri, width: '100%', height: 352 },
        (controller) => {
          controllerRef.current = controller
          controller.addListener('playback_update', (e) => {
            callbackRef.current(e.data)
          })
        }
      )
    }

    // Case 1: API already loaded from a previous render — use it immediately
    if (window._spotifyIFrameAPI) {
      createController(window._spotifyIFrameAPI)
      return
    }

    // Case 2: First load — set the global callback then inject the script
    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      window._spotifyIFrameAPI = IFrameAPI
      createController(IFrameAPI)
    }

    if (!document.getElementById('spotify-iframe-api')) {
      const script = document.createElement('script')
      script.id = 'spotify-iframe-api'
      script.src = 'https://open.spotify.com/embed/iframe-api/v1'
      script.async = true
      document.body.appendChild(script)
    }

    return () => {
      controllerRef.current?.destroy()
      controllerRef.current = null
    }
  }, [trackId])

  return (
    <div className="rounded-xl overflow-hidden shadow-xl min-h-[352px] bg-gray-900">
      <div ref={containerRef} />
    </div>
  )
}
