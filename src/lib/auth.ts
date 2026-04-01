import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * Lazy-create pattern: no webhooks needed.
 * On every authenticated API call we upsert the user row.
 * If the user already exists the update: {} is a no-op.
 */
export async function getAuthenticatedUser() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    create: { clerkId: userId, credits: 10 },
    update: {},
  })

  return user
}
