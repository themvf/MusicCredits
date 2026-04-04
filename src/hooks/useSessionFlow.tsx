'use client'

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type SessionFlowState =
  | 'IDLE'
  | 'LISTENING'
  | 'FEEDBACK_PENDING'
  | 'PLAYLIST_SELECT'
  | 'SNAPSHOT_TAKEN'
  | 'AWAITING_USER_ADD'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'VERIFY_FAILED'

interface SessionFlowContextValue {
  state: SessionFlowState
  setState: (state: SessionFlowState) => void
  markUnlocked: () => void
  markFeedbackSubmitted: () => void
  markSnapshotTaken: () => void
  markAwaitingUserAdd: () => void
  markVerifying: () => void
  markVerified: () => void
  markVerifyFailed: () => void
}

const SessionFlowContext = createContext<SessionFlowContextValue | null>(null)

export function SessionFlowProvider({
  initialState,
  children,
}: {
  initialState: SessionFlowState
  children: ReactNode
}) {
  const [state, setState] = useState<SessionFlowState>(initialState)

  const value = useMemo<SessionFlowContextValue>(
    () => ({
      state,
      setState,
      markUnlocked: () => {
        setState((current) =>
          current === 'LISTENING' ? 'FEEDBACK_PENDING' : current
        )
      },
      markFeedbackSubmitted: () => setState('PLAYLIST_SELECT'),
      markSnapshotTaken: () => setState('SNAPSHOT_TAKEN'),
      markAwaitingUserAdd: () => setState('AWAITING_USER_ADD'),
      markVerifying: () => setState('VERIFYING'),
      markVerified: () => setState('VERIFIED'),
      markVerifyFailed: () => setState('VERIFY_FAILED'),
    }),
    [state]
  )

  return (
    <SessionFlowContext.Provider value={value}>
      {children}
    </SessionFlowContext.Provider>
  )
}

export function useSessionFlow() {
  const context = useContext(SessionFlowContext)

  if (!context) {
    throw new Error('useSessionFlow must be used within SessionFlowProvider')
  }

  return context
}
