'use client'

import { useEffect, useMemo, useState } from 'react'
import FeedbackPanel from '@/components/FeedbackPanel'
import ListenProgressBar from '@/components/ListenProgressBar'
import PlaylistVerifyWizard, {
  type VerificationState,
} from '@/components/PlaylistVerifyWizard'
import SpotifyEmbed from '@/components/SpotifyEmbed'
import VerificationSuccessState from '@/components/VerificationSuccessState'
import {
  BoltIcon,
  HeadphonesIcon,
  LockIcon,
  StarIcon,
  TracksIcon,
} from '@/components/AppIcons'
import { SessionFlowProvider, useSessionFlow, type SessionFlowState } from '@/hooks/useSessionFlow'
import { useListeningSession } from '@/hooks/useListeningSession'
import { extractSpotifyTrackId } from '@/lib/spotify'

interface SnapshotState {
  id: string
  playlistId: string
  createdAt: string
}

interface ListenPageClientProps {
  trackId: string
  sessionId: string
  spotifyTrackId: string | null
  spotifyUrl: string
  trackTitle: string
  artistName: string
  initialCredits: number
  spotifyConnected: boolean
  callbackStatus: 'connected' | 'error' | null
  sessionCompleted: boolean
  initialSnapshot: SnapshotState | null
  initialVerification: VerificationState | null
}

function getInitialFlowState({
  sessionCompleted,
  initialSnapshot,
  initialVerification,
}: Pick<
  ListenPageClientProps,
  'sessionCompleted' | 'initialSnapshot' | 'initialVerification'
>): SessionFlowState {
  if (initialVerification?.verified && initialVerification.quality === 'verified') {
    return 'VERIFIED'
  }

  if (
    initialVerification?.quality === 'failed' ||
    initialVerification?.quality === 'low_quality'
  ) {
    return 'VERIFY_FAILED'
  }

  if (initialSnapshot) {
    return 'AWAITING_USER_ADD'
  }

  if (sessionCompleted) {
    return 'PLAYLIST_SELECT'
  }

  return 'LISTENING'
}

function LockedFeedbackPanel() {
  return (
    <div className="surface-card p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
          <LockIcon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
            Waiting for unlock
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Feedback activates after 30 seconds
          </h3>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-400">
        Finish 30 real seconds of Spotify playback to unlock the vibe chips,
        star rating, and playlist step.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {['Energetic', 'Chill', 'Emotional', 'Hype', 'Unique'].map((label) => (
          <span
            key={label}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm font-medium text-slate-500 opacity-35"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] opacity-35"
          >
            <StarIcon className="h-4 w-4 text-slate-600" />
          </span>
        ))}
      </div>
    </div>
  )
}

function ListeningSessionSurface({
  trackId,
  sessionId,
  spotifyTrackId,
  spotifyUrl,
  trackTitle,
  artistName,
  initialCredits,
  spotifyConnected,
  callbackStatus,
  sessionCompleted,
  initialSnapshot,
  initialVerification,
}: ListenPageClientProps) {
  const { state, markUnlocked } = useSessionFlow()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= 1024
  )
  const [wizardSheetOpen, setWizardSheetOpen] = useState(false)
  const [newCredits, setNewCredits] = useState<number | null>(
    sessionCompleted ? initialCredits : null
  )
  const [verification, setVerification] = useState<VerificationState | null>(
    initialVerification
  )
  const { displayMs, isEligible, interruptionsCount } = useListeningSession(isPlaying)

  const resolvedSpotifyTrackId =
    spotifyTrackId ?? extractSpotifyTrackId(spotifyUrl)

  const connectUrl = `/api/spotify/login?returnTo=${encodeURIComponent(
    `/listen?trackId=${trackId}&sessionId=${sessionId}`
  )}`

  const showFeedbackPanel = state === 'FEEDBACK_PENDING'
  const showWizard =
    state === 'PLAYLIST_SELECT' ||
    state === 'SNAPSHOT_TAKEN' ||
    state === 'AWAITING_USER_ADD' ||
    state === 'VERIFYING' ||
    state === 'VERIFY_FAILED'
  const showVerifiedState = state === 'VERIFIED' && verification

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 1024)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (
      isEligible &&
      !sessionCompleted &&
      state === 'LISTENING'
    ) {
      markUnlocked()
    }
  }, [isEligible, markUnlocked, sessionCompleted, state])

  useEffect(() => {
    if (showWizard && !isDesktop) {
      setWizardSheetOpen(true)
    }
  }, [isDesktop, showWizard])

  function handlePlaybackUpdate({
    isPlaying: playing,
  }: {
    isPlaying: boolean
    position: number
  }) {
    setIsPlaying(playing)
  }

  function handleFeedbackSuccess(credits: number) {
    setNewCredits(credits)
  }

  function handleVerified(nextVerification: VerificationState) {
    setVerification(nextVerification)
    setWizardSheetOpen(false)
  }

  if (!resolvedSpotifyTrackId) {
    return (
      <div className="surface-card p-8 text-sm text-slate-400">
        The stored Spotify URL is invalid. Start another session from the queue.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <span className="eyebrow-badge">
          <HeadphonesIcon className="h-4 w-4" />
          Listen &amp; Earn
        </span>
        <div className="max-w-3xl space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            One session. One feedback step. One verification flow.
          </h1>
          <p className="text-base leading-7 text-slate-400">
            Keep listening inside Spotify, unlock feedback at 30 seconds, and
            move straight into playlist verification without leaving this page.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <SpotifyEmbed
            trackId={resolvedSpotifyTrackId}
            trackTitle={trackTitle}
            artistName={artistName}
            spotifyUrl={spotifyUrl}
            onPlaybackUpdate={handlePlaybackUpdate}
          />

          {!sessionCompleted && (
            <ListenProgressBar currentMs={displayMs} />
          )}

          {showWizard && !isDesktop && (
            <div className="surface-card p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand-300">
                  <TracksIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">
                    Playlist verification is ready
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Continue the step-by-step add verification flow in a focused
                    bottom sheet.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWizardSheetOpen(true)}
                className="button-primary mt-5 w-full"
              >
                Verify Playlist Add
              </button>
            </div>
          )}

          {!sessionCompleted && (
            <div className="surface-card-soft p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand-300">
                  <BoltIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">Session flow</p>
                  <p className="text-sm text-slate-400">
                    Progress only moves while Spotify is actively playing in this
                    tab. Once you hit 30 seconds, the feedback panel opens
                    automatically.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {showVerifiedState ? (
            <VerificationSuccessState
              verificationId={verification.id}
              playlistName={verification.playlistName}
              verifiedAt={verification.verifiedAt}
              persistenceDueAt={verification.persistenceDueAt}
              newCredits={newCredits ?? initialCredits}
            />
          ) : showFeedbackPanel ? (
            <FeedbackPanel
              sessionId={sessionId}
              accumulatedMs={displayMs}
              resetsCount={interruptionsCount}
              onSuccess={handleFeedbackSuccess}
            />
          ) : showWizard && isDesktop ? (
            <PlaylistVerifyWizard
              trackId={trackId}
              trackTitle={trackTitle}
              artistName={artistName}
              connectUrl={connectUrl}
              spotifyConnected={spotifyConnected}
              callbackStatus={callbackStatus}
              initialSnapshot={initialSnapshot}
              initialVerification={verification}
              onVerified={handleVerified}
            />
          ) : (
            <LockedFeedbackPanel />
          )}
        </div>
      </div>

      {!isDesktop && wizardSheetOpen && showWizard && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button
            type="button"
            aria-label="Close verification sheet"
            onClick={() => setWizardSheetOpen(false)}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />
          <div className="animate-slide-up-sheet absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#0b1220] p-4 shadow-[0_-25px_70px_-35px_rgba(15,23,42,0.95)]">
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/10" />
            <PlaylistVerifyWizard
              trackId={trackId}
              trackTitle={trackTitle}
              artistName={artistName}
              connectUrl={connectUrl}
              spotifyConnected={spotifyConnected}
              callbackStatus={callbackStatus}
              initialSnapshot={initialSnapshot}
              initialVerification={verification}
              onVerified={handleVerified}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function ListenPageClient(props: ListenPageClientProps) {
  const initialFlowState = useMemo(
    () =>
      getInitialFlowState({
        sessionCompleted: props.sessionCompleted,
        initialSnapshot: props.initialSnapshot,
        initialVerification: props.initialVerification,
      }),
    [props.initialSnapshot, props.initialVerification, props.sessionCompleted]
  )

  return (
    <SessionFlowProvider initialState={initialFlowState}>
      <ListeningSessionSurface {...props} />
    </SessionFlowProvider>
  )
}
