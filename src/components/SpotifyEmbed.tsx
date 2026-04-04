'use client'

import { useEffect, useRef, useState } from 'react'
import { HeadphonesIcon, WaveformIcon } from '@/components/AppIcons'

interface PlaybackState {
  isPlaying: boolean
  position: number
}

interface SpotifyPlaybackUpdateEvent {
  data?: {
    isPaused?: boolean
    isBuffering?: boolean
    position?: number
  }
}

interface SpotifyEmbedController {
  addListener: (
    eventName: 'ready' | 'playback_started' | 'playback_update',
    listener: (event: SpotifyPlaybackUpdateEvent) => void
  ) => void
  destroy: () => void
}

interface SpotifyIframeApi {
  createController: (
    element: HTMLElement,
    options: {
      uri: string
      width?: string | number
      height?: string | number
      theme?: 'dark'
    },
    callback: (controller: SpotifyEmbedController) => void
  ) => void
}

declare global {
  interface Window {
    __spotifyIframeApi?: SpotifyIframeApi
    __spotifyIframeApiPromise?: Promise<SpotifyIframeApi>
    onSpotifyIframeApiReady?: (api: SpotifyIframeApi) => void
  }
}

function loadSpotifyIframeApi() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Spotify iFrame API is only available in the browser'))
  }

  if (window.__spotifyIframeApi) {
    return Promise.resolve(window.__spotifyIframeApi)
  }

  if (window.__spotifyIframeApiPromise) {
    return window.__spotifyIframeApiPromise
  }

  window.__spotifyIframeApiPromise = new Promise<SpotifyIframeApi>((resolve, reject) => {
    const previousReadyHandler = window.onSpotifyIframeApiReady
    const timeoutId = window.setTimeout(() => {
      window.__spotifyIframeApiPromise = undefined
      reject(new Error('Spotify iFrame API timed out'))
    }, 15_000)

    window.onSpotifyIframeApiReady = (api: SpotifyIframeApi) => {
      window.clearTimeout(timeoutId)
      window.__spotifyIframeApi = api
      previousReadyHandler?.(api)
      resolve(api)
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-spotify-iframe-api]'
    )

    if (existingScript) {
      return
    }

    const script = document.createElement('script')
    script.src = 'https://open.spotify.com/embed/iframe-api/v1'
    script.async = true
    script.dataset.spotifyIframeApi = 'true'
    script.onerror = () => {
      window.clearTimeout(timeoutId)
      window.__spotifyIframeApiPromise = undefined
      reject(new Error('Spotify iFrame API failed to load'))
    }
    document.body.appendChild(script)
  })

  return window.__spotifyIframeApiPromise
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
  const containerRef = useRef<HTMLDivElement | null>(null)
  const controllerRef = useRef<SpotifyEmbedController | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  callbackRef.current = onPlaybackUpdate

  useEffect(() => {
    let cancelled = false

    setSyncError(null)
    callbackRef.current({
      isPlaying: false,
      position: 0,
    })

    loadSpotifyIframeApi()
      .then((api) => {
        if (cancelled || !containerRef.current) {
          return
        }

        containerRef.current.innerHTML = ''

        api.createController(
          containerRef.current,
          {
            uri: `spotify:track:${trackId}`,
            width: '100%',
            height: 352,
            theme: 'dark',
          },
          (controller) => {
            if (cancelled) {
              controller.destroy()
              return
            }

            controllerRef.current = controller

            controller.addListener('ready', () => {
              callbackRef.current({
                isPlaying: false,
                position: 0,
              })
            })

            controller.addListener('playback_started', () => {
              callbackRef.current({
                isPlaying: true,
                position: 0,
              })
            })

            controller.addListener('playback_update', (event) => {
              const positionMs =
                typeof event.data?.position === 'number' ? event.data.position : 0

              callbackRef.current({
                isPlaying:
                  !event.data?.isPaused && !event.data?.isBuffering,
                position: Math.floor(positionMs / 1000),
              })
            })
          }
        )
      })
      .catch((error) => {
        console.error('[Spotify embed sync failed]', error)
        if (!cancelled) {
          setSyncError('Spotify sync is unavailable. Refresh the page and try again.')
        }
      })

    return () => {
      cancelled = true
      controllerRef.current?.destroy()
      controllerRef.current = null
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
      callbackRef.current({
        isPlaying: false,
        position: 0,
      })
    }
  }, [trackId])

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
        {syncError ? (
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
        ) : (
          <div
            ref={containerRef}
            aria-label="Spotify track player"
            className="min-h-[352px]"
          />
        )}
      </div>

      {syncError && (
        <p className="mt-4 text-sm text-rose-300">{syncError}</p>
      )}

      <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
        <WaveformIcon className="h-3.5 w-3.5" />
        Scrubbing is allowed. Playback time only advances while audio is running.
      </div>
    </div>
  )
}
