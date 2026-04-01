import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const submitSchema = z.object({
  // Must be an exact Spotify track URL with a 22-char alphanumeric track ID
  spotifyUrl: z
    .string()
    .regex(
      /^https:\/\/open\.spotify\.com\/track\/[A-Za-z0-9]{22}/,
      'Must be a valid Spotify track URL (https://open.spotify.com/track/XXXX)'
    ),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    // Parse and validate the request body
    const body = await req.json()
    const parsed = submitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { spotifyUrl } = parsed.data

    // Credit check before any write
    if (user.credits < 10) {
      return NextResponse.json(
        { error: 'Insufficient credits. You need at least 10 credits.' },
        { status: 402 }
      )
    }

    // Atomic transaction: create the track AND deduct credits together.
    // If either fails, neither change is committed.
    const [track] = await prisma.$transaction([
      prisma.track.create({
        data: {
          userId: user.id,
          spotifyUrl: spotifyUrl.trim(),
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: 10 } },
      }),
    ])

    return NextResponse.json(track, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[POST /api/tracks]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
