import { auth } from '@clerk/nextjs/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * Lazy-create pattern: no webhooks needed.
 * On every authenticated API call we upsert the user row.
 *
 * Race condition handling: Next.js App Router renders layout and page
 * components in parallel, so two simultaneous upserts can race on a
 * brand-new user. If that happens, Prisma throws P2002 (unique constraint).
 * We catch it and fall back to findUnique — the winner already created the row.
 */
export async function getAuthenticatedUser() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      create: { clerkId: userId, credits: 10 },
      update: {},
    })
    return user
  } catch (error) {
    // P2002 = unique constraint violation — a concurrent request already
    // created this user. Just fetch the row that was created.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const user = await prisma.user.findUnique({ where: { clerkId: userId } })
      if (user) return user
    }
    throw error
  }
}
