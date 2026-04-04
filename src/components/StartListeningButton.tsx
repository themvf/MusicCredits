'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlayIcon, SparkIcon } from '@/components/AppIcons'
import StatusToast from '@/components/StatusToast'
import { cn } from '@/lib/cn'

interface StartListeningButtonProps {
  label?: string
  buttonClassName?: string
  fullWidth?: boolean
  showHelperText?: boolean
}

export default function StartListeningButton({
  label = 'Start Listening',
  buttonClassName,
  fullWidth = false,
  showHelperText = false,
}: StartListeningButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{
    open: boolean
    tone: 'error' | 'info'
    title: string
    description?: string
  }>({
    open: false,
    tone: 'info',
    title: '',
  })

  async function handleStart() {
    setLoading(true)

    try {
      const trackRes = await fetch('/api/tracks/next')

      if (trackRes.status === 404) {
        setToast({
          open: true,
          tone: 'info',
          title: 'Queue is empty',
          description: 'No tracks are waiting yet. Submit one to kick off the loop.',
        })
        setLoading(false)
        return
      }

      if (!trackRes.ok) {
        setToast({
          open: true,
          tone: 'error',
          title: 'Could not load the queue',
          description: 'Please try again in a moment.',
        })
        setLoading(false)
        return
      }

      const track = await trackRes.json()

      const sessionRes = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: track.id }),
      })

      if (sessionRes.status === 409) {
        setToast({
          open: true,
          tone: 'info',
          title: 'Session already completed',
          description:
            'You have already finished the only available queued track right now.',
        })
        setLoading(false)
        return
      }

      if (!sessionRes.ok) {
        setToast({
          open: true,
          tone: 'error',
          title: 'Could not start a session',
          description: 'Try again once the queue refreshes.',
        })
        setLoading(false)
        return
      }

      const session = await sessionRes.json()
      router.push(`/listen?trackId=${track.id}&sessionId=${session.id}`)
    } catch {
      setToast({
        open: true,
        tone: 'error',
        title: 'Network error',
        description: 'Check your connection and retry.',
      })
      setLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-3', fullWidth && 'w-full')}>
      <button
        type="button"
        onClick={handleStart}
        disabled={loading}
        className={cn(
          'button-primary',
          fullWidth && 'w-full',
          loading && 'cursor-wait opacity-80',
          buttonClassName
        )}
      >
        {loading ? (
          <>
            <SparkIcon className="h-4 w-4" />
            Finding a track...
          </>
        ) : (
          <>
            <PlayIcon className="h-4 w-4" />
            {label}
          </>
        )}
      </button>

      {showHelperText && (
        <p className="text-sm leading-6 text-slate-400">
          Earn one verified credit for every completed session.
        </p>
      )}

      <StatusToast
        open={toast.open}
        tone={toast.tone}
        title={toast.title}
        description={toast.description}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />
    </div>
  )
}
