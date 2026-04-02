'use client'

import { useEffect, useRef, useState } from 'react'

interface UseListeningSessionResult {
  displayMs: number
  isEligible: boolean
}

/**
 * Accumulates active listening time, driven by two signals:
 *   1. isPlaying  — audio is actually playing (from Spotify IFrame API)
 *   2. tab visible — Page Visibility API (tab must stay in foreground)
 *
 * Time ONLY accumulates when BOTH conditions are true.
 * This means pausing, switching tabs, or navigating away all pause the timer.
 *
 * The hook re-runs its effect whenever isPlaying changes, which:
 *   - On pause: snapshots elapsed time into accumulatedRef
 *   - On play:  records a new tracking start timestamp
 */
export function useListeningSession(isPlaying: boolean): UseListeningSessionResult {
  const [displayMs, setDisplayMs] = useState(0)

  // Frozen sum of all completed play intervals
  const accumulatedRef = useRef(0)
  // Timestamp when the current play interval started (null = not tracking)
  const trackingStartRef = useRef<number | null>(null)

  useEffect(() => {
    // Snapshot: add elapsed time from the current interval into accumulated,
    // then clear the tracking start so we stop accumulating.
    function snapshot() {
      if (trackingStartRef.current !== null) {
        accumulatedRef.current += Date.now() - trackingStartRef.current
        trackingStartRef.current = null
      }
    }

    // Begin a new tracking interval if not already tracking
    function beginTracking() {
      if (trackingStartRef.current === null) {
        trackingStartRef.current = Date.now()
      }
    }

    // Combine both signals: only track when playing AND tab is visible
    const shouldTrack = isPlaying && !document.hidden

    if (shouldTrack) {
      beginTracking()
    } else {
      // Either paused or tab hidden — snapshot any in-progress interval
      snapshot()
    }

    // Visibility change handler: pause/resume tracking based on tab state
    function handleVisibilityChange() {
      if (document.hidden) {
        // Tab went to background — stop accumulating
        snapshot()
      } else if (isPlaying) {
        // Tab came back to foreground and audio is still playing — resume
        beginTracking()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Tick every 500ms to update the live display value
    const intervalId = setInterval(() => {
      const inProgress =
        trackingStartRef.current !== null
          ? Date.now() - trackingStartRef.current
          : 0
      setDisplayMs(accumulatedRef.current + inProgress)
    }, 500)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(intervalId)
      // Snapshot on cleanup so accumulated is up to date for the next effect run
      snapshot()
    }
  }, [isPlaying]) // Re-run whenever playback state changes

  return {
    // Use displayMs for submission — it includes the live in-progress interval.
    // accumulatedRef.current alone would be 0 if the user never paused.
    displayMs,
    isEligible: displayMs >= 30_000,
  }
}
