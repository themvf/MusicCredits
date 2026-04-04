'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseListeningSessionResult {
  displayMs: number
  isEligible: boolean
  interruptionsCount: number
}

/**
 * Accumulates TOTAL active listening time while playback is running and the
 * page remains visible.
 *
 * Interruptions no longer reset progress. We simply stop accumulating until
 * playback resumes.
 *
 * interruptionsCount still captures pauses/tab hides for behavioral logging.
 */
export function useListeningSession(isPlaying: boolean): UseListeningSessionResult {
  const [displayMs, setDisplayMs] = useState(0)
  const [interruptionsCount, setInterruptionsCount] = useState(0)

  const accumulatedMsRef = useRef(0)
  const trackingStartRef = useRef<number | null>(null)

  const stopTracking = useCallback((countInterruption: boolean) => {
    if (trackingStartRef.current !== null) {
      accumulatedMsRef.current += Date.now() - trackingStartRef.current
      trackingStartRef.current = null
      setDisplayMs(accumulatedMsRef.current)
    }

    if (countInterruption) {
      setInterruptionsCount((count) => count + 1)
    }
  }, [])

  const startTracking = useCallback(() => {
    if (trackingStartRef.current === null && !document.hidden) {
      trackingStartRef.current = Date.now()
    }
  }, [])

  useEffect(() => {
    if (isPlaying) {
      startTracking()
    } else if (trackingStartRef.current !== null || accumulatedMsRef.current > 0) {
      stopTracking(true)
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        if (trackingStartRef.current !== null || accumulatedMsRef.current > 0) {
          stopTracking(true)
        }
        return
      }

      if (isPlaying) {
        startTracking()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    const intervalId = setInterval(() => {
      if (trackingStartRef.current !== null) {
        setDisplayMs(
          accumulatedMsRef.current + (Date.now() - trackingStartRef.current)
        )
      }
    }, 500)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(intervalId)
    }
  }, [isPlaying, startTracking, stopTracking])

  return {
    displayMs,
    isEligible: displayMs >= 30_000,
    interruptionsCount,
  }
}
