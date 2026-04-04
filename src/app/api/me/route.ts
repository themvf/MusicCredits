import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()

    return NextResponse.json({
      id: user.id,
      credits: user.credits,
      clerkId: user.clerkId,
    })
  } catch (error) {
    return handleApiError(error, 'GET /api/me')
  }
}
