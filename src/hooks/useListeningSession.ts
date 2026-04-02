'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseListeningSessionResult {
  displayMs: number
  isEligible: boolean
  reset: () => void  // Call on forward seek to restart the counter
}

/**
 * Accumulates CONTINUOUS active listening time.
 *
 * The counter RESETS to zero on any interruption:
 *   - Audio paused (isPlaying → false)
 *   - Tab hidden (Page Visibility API)
 *   - External reset() call (forward seek detected by parent)
 *
 * This means the user must listen to 30 UNINTERRUPTED seconds.
 * Pausing, switching tabs, or seeking forward all restart the clock.
 *
 * Time only accumulates when isPlaying=true AND tab is visible.
 */
export function useListeningSession(isPlaying: boolean): UseListeningSessionResult {
  const [displayMs, setDisplayMs] = useState(0)

  // Timestamp when the current uninterrupted listen interval started
  const trackingStartRef = useRef<number | null>(null)

  // reset() is exposed so ListenPageClient can call it on seek detection
  const reset = useCallback(() => {
    trackingStartRef.current = null
    setDisplayMs(0)
    // If currently playing and tab is visible, immediately restart from now
    if (!document.hidden) {
      trackingStartRef.current = Date.now()
    }
  }, [])

  useEffect(() => {
    if (!isPlaying) {
      // Audio paused — reset all progress. User must listen continuously.
      trackingStartRef.current = null
      setDisplayMs(0)
      return
    }

    // Audio is playing — start tracking if tab is visible
    if (!document.hidden) {
      trackingStartRef.current = Date.now()
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        // Tab hidden while playing — reset progress
        trackingStartRef.current = null
        setDisplayMs(0)
      } else {
        // Tab came back while still playing — restart from now
        trackingStartRef.current = Date.now()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Tick every 500ms to update the live display
    const intervalId = setInterval(() => {
      if (trackingStartRef.current !== null) {
        setDisplayMs(Date.now() - trackingStartRef.current)
      }
    }, 500)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(intervalId)
      // Reset on cleanup (isPlaying changed — effect re-runs)
      trackingStartRef.current = null
    }
  }, [isPlaying])

  return {
    displayMs,
    isEligible: displayMs >= 30_000,
    reset,
  }
}
