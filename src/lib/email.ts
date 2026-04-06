import 'server-only'

import { serverEnv } from '@/lib/server-env'

// Resend is loaded lazily so missing API key is a soft failure, not a crash.
// Emails log a warning instead of throwing so the rest of the flow continues.
async function getResend() {
  if (!serverEnv.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — email skipped')
    return null
  }
  const { Resend } = await import('resend')
  return new Resend(serverEnv.RESEND_API_KEY)
}

const FROM = serverEnv.RESEND_FROM_EMAIL ?? 'SoundSwap <noreply@soundswap.fm>'
const APP_URL = serverEnv.APP_URL ?? 'https://soundswap.fm'

export async function sendCuratorApprovalEmail(to: string) {
  const resend = await getResend()
  if (!resend) return

  await resend.emails.send({
    from: FROM,
    to,
    subject: "You're in — your curator profile is live on SoundSwap",
    text: [
      "Great news: your curator application has been approved.",
      "",
      "Your curator profile is live. Log in to start reviewing tracks and earning on SoundSwap.",
      "",
      `${APP_URL}/dashboard`,
      "",
      "— The SoundSwap team",
    ].join('\n'),
  })
}

export async function sendCuratorRejectionEmail(
  to: string,
  reason: string,
  canReapplyImmediately: boolean
) {
  const resend = await getResend()
  if (!resend) return

  const reapplyLine = canReapplyImmediately
    ? "You're welcome to reapply at any time."
    : "You're welcome to reapply in 30 days."

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your SoundSwap curator application',
    text: [
      "Thanks for applying to be a curator on SoundSwap.",
      "",
      `We weren't able to approve your application at this time: ${reason}`,
      "",
      reapplyLine,
      "",
      `${APP_URL}/apply-curator`,
      "",
      "— The SoundSwap team",
    ].join('\n'),
  })
}
