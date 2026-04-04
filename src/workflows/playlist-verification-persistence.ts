import { sleep } from 'workflow'
import { reconcilePlaylistVerificationPersistence } from '@/lib/playlist-verification'

async function finalizePlaylistVerificationPersistence(verificationId: string) {
  'use step'

  await reconcilePlaylistVerificationPersistence(verificationId, {
    allowEarly: true,
  })
}

export async function runPlaylistVerificationPersistenceWorkflow(
  verificationId: string,
  dueAtIso: string
) {
  'use workflow'

  await sleep(new Date(dueAtIso))
  await finalizePlaylistVerificationPersistence(verificationId)
}
