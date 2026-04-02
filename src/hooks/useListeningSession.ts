'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseListeningSessionResult {
  displayMs: number
  isEligible: boolean
  resetsCount: number   // Total interruptions — sent to backend for behavioral logging
  reset: () => void     // Called externally on forward seek
}

/**
 * Accumulates CONTINUOUS active listening time.
 *
 * The counter RESETS to zero on any interruption:
 *   - Audio paused (isPlaying → false)
 *   - Tab hidden (Page Visibility API)
 *   - Forward seek (external reset() call from ListenPageClient)
 *
 * resetsCount increments on every interruption and is sent to the backend
 * with the rating so we can build behavioral analytics and trust scoring.
 */
export function useListeningSession(isPlaying: boolean): UseListeningSessionResult {
  const [displayMs, setDisplayMs] = useState(0)
  const [resetsCount, setResetsCount] = useState(0)

  const trackingStartRef = useRef<number | null>(null)

  // Internal helper — resets timer and bumps the interruption counter
  const doReset = useCallback((restartIfVisible: boolean) => {
    trackingStartRef.current = null
    setDisplayMs(0)
    setResetsCount((c) => c + 1)
    if (restartIfVisible && !document.hidden) {
      trackingStartRef.current = Date.now()
    }
  }, [])

  // Exposed for seek detection in ListenPageClient
  const reset = useCallback(() => {
    doReset(isPlaying)
  }, [doReset, isPlaying])

  useEffect(() => {
    if (!isPlaying) {
      // Paused — reset progress. Only count if this isn't the very first state
      // (avoid counting the initial mount as an interruption)
      if (trackingStartRef.current !== null || displayMs > 0) {
        trackingStartRef.current = null
        setDisplayMs(0)
        setResetsCount((c) => c + 1)
      }
      return
    }

    // Audio is playing — start tracking from now if tab is visible
    if (!document.hidden) {
      trackingStartRef.current = Date.now()
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        // Tab hidden — reset progress
        trackingStartRef.current = null
        setDisplayMs(0)
        setResetsCount((c) => c + 1)
      } else {
        // Tab visible again while still playing — restart
        trackingStartRef.current = Date.now()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    const intervalId = setInterval(() => {
      if (trackingStartRef.current !== null) {
        setDisplayMs(Date.now() - trackingStartRef.current)
      }
    }, 500)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(intervalId)
      trackingStartRef.current = null
    }
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    displayMs,
    isEligible: displayMs >= 30_000,
    resetsCount,
    reset,
  }
}
