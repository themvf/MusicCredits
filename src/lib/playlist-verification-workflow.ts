import 'server-only'

import { start } from 'workflow/api'
import { runPlaylistVerificationPersistenceWorkflow } from '@/workflows/playlist-verification-persistence'

export async function schedulePlaylistVerificationPersistenceCheck(
  verificationId: string,
  dueAt: Date
) {
  try {
    await start(runPlaylistVerificationPersistenceWorkflow, [
      verificationId,
      dueAt.toISOString(),
    ])
  } catch (error) {
    console.error(
      '[Playlist verification persistence scheduling failed]',
      verificationId,
      error
    )
  }
}
