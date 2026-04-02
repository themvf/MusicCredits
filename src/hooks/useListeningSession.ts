'use client'

import { useEffect, useRef, useState } from 'react'

interface UseListeningSessionResult {
  started: boolean
  startTimer: () => void
  accumulatedMs: number
  displayMs: number
  isEligible: boolean
}

/**
 * Tracks "active listening time" using the Page Visibility API.
 *
 * Time does NOT start on mount — the user must call startTimer() first
 * (after pressing play in the Spotify embed). This prevents the timer
 * from running before the user has actually started listening.
 *
 * Once started:
 * - Time only counts when the tab is in the foreground.
 * - On visibilitychange → hidden: snapshot the elapsed time.
 * - On visibilitychange → visible: record a new start timestamp.
 * - A 500ms interval refreshes displayMs so the UI ticks smoothly.
 */
export function useListeningSession(): UseListeningSessionResult {
  const [started, setStarted] = useState(false)
  const [displayMs, setDisplayMs] = useState(0)

  const accumulatedRef = useRef(0)
  const lastVisibleAtRef = useRef<number | null>(null)
  // Track whether the interval/listeners are active
  const activeRef = useRef(false)

  function startTimer() {
    if (activeRef.current) return
    activeRef.current = true
    setStarted(true)
    // Begin tracking from now
    if (!document.hidden) {
      lastVisibleAtRef.current = Date.now()
    }
  }

  useEffect(() => {
    if (!started) return

    function handleVisibilityChange() {
      if (document.hidden) {
        if (lastVisibleAtRef.current !== null) {
          accumulatedRef.current += Date.now() - lastVisibleAtRef.current
          lastVisibleAtRef.current = null
        }
      } else {
        lastVisibleAtRef.current = Date.now()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

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
      // Final snapshot on unmount
      if (lastVisibleAtRef.current !== null) {
        accumulatedRef.current += Date.now() - lastVisibleAtRef.current
        lastVisibleAtRef.current = null
      }
    }
  }, [started])

  return {
    started,
    startTimer,
    accumulatedMs: accumulatedRef.current,
    displayMs,
    isEligible: displayMs >= 30_000,
  }
}
