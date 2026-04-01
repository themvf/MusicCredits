'use client'

import { useEffect, useRef, useState } from 'react'

interface UseListeningSessionResult {
  /** Total ms the user has actively been listening (tab visible) */
  accumulatedMs: number
  /** Display value: accumulated + currently-visible segment */
  displayMs: number
  /** True once displayMs >= 30000 */
  isEligible: boolean
}

/**
 * Tracks "active listening time" using the Page Visibility API.
 *
 * - Time only counts when the tab is in the foreground.
 * - On visibilitychange → hidden: snapshot the elapsed time from lastVisibleAt.
 * - On visibilitychange → visible: record a new lastVisibleAt.
 * - A 500ms interval refreshes displayMs so the UI ticks smoothly.
 */
export function useListeningSession(): UseListeningSessionResult {
  // accumulatedMs is the sum of all completed visible intervals
  const [accumulatedMs, setAccumulatedMs] = useState(0)
  // displayMs drives the UI ticker (includes in-progress interval)
  const [displayMs, setDisplayMs] = useState(0)

  // Use a ref so interval/event callbacks always see the latest values
  // without becoming stale closures.
  const accumulatedRef = useRef(0)
  const lastVisibleAtRef = useRef<number | null>(null)

  useEffect(() => {
    // Initialise: if the tab is already visible, start tracking immediately
    if (!document.hidden) {
      lastVisibleAtRef.current = Date.now()
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        // Tab went to background — add elapsed time to accumulated bucket
        if (lastVisibleAtRef.current !== null) {
          accumulatedRef.current += Date.now() - lastVisibleAtRef.current
          setAccumulatedMs(accumulatedRef.current)
          lastVisibleAtRef.current = null
        }
      } else {
        // Tab came back to foreground — start a new interval
        lastVisibleAtRef.current = Date.now()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Tick every 500ms to update the display value
    const intervalId = setInterval(() => {
      const inProgressMs =
        lastVisibleAtRef.current !== null
          ? Date.now() - lastVisibleAtRef.current
          : 0
      setDisplayMs(accumulatedRef.current + inProgressMs)
    }, 500)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(intervalId)

      // Final snapshot so callers can read accumulatedMs after unmount
      if (lastVisibleAtRef.current !== null) {
        accumulatedRef.current += Date.now() - lastVisibleAtRef.current
        setAccumulatedMs(accumulatedRef.current)
        lastVisibleAtRef.current = null
      }
    }
  }, [])

  return {
    accumulatedMs: accumulatedRef.current,
    displayMs,
    isEligible: displayMs >= 30_000,
  }
}
