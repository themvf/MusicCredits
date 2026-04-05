import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleApiError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fetchSpotifyTrackPreviewByUrl } from '@/lib/spotify-api'

export const runtime = 'nodejs'

const soundsLikeArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  genres: z.array(z.string()),
  followers: z.number(),
  imageUrl: z.string().nullable().optional(),
})

const submitSchema = z.object({
  spotifyUrl: z
    .string()
    .regex(
      /^https:\/\/open\.spotify\.com\/track\/[A-Za-z0-9]{22}/,
      'Must be a valid Spotify track URL (https://open.spotify.com/track/XXXX)'
    ),
  genres: z
    .array(z.string().min(1))
    .min(1, 'Select at least one genre')
    .max(2, 'Select up to 2 genres'),
  moods: z
    .array(z.string().min(1))
    .min(1, 'Select at least one mood')
    .max(3, 'Select up to 3 moods'),
  soundsLikeArtists: z.array(soundsLikeArtistSchema).max(2).optional(),
  story: z.string().max(120).optional(),
  targetRegion: z.string().min(1, 'Select a target region'),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    const body = await req.json()
    const parsed = submitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { spotifyUrl, genres, moods, soundsLikeArtists, story, targetRegion } =
      parsed.data

    const metadata = await fetchSpotifyTrackPreviewByUrl(spotifyUrl.trim())

    if (user.credits < 10) {
      return NextResponse.json(
        { error: 'Insufficient credits. You need at least 10 credits.' },
        { status: 402 }
      )
    }

    const [track] = await prisma.$transaction([
      prisma.track.create({
        data: {
          userId: user.id,
          spotifyUrl: metadata.spotifyUrl,
          spotifyTrackId: metadata.spotifyTrackId,
          title: metadata.title,
          artistName: metadata.artistName,
          artworkUrl: metadata.artworkUrl,
          releasedAt: metadata.releaseDate ? new Date(metadata.releaseDate) : null,
          durationMs: metadata.durationMs,
          bpm: metadata.bpm,
          explicit: metadata.explicit,
          genres,
          moods,
          soundsLikeArtists: soundsLikeArtists ?? [],
          story: story ?? null,
          targetRegion,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: 10 } },
      }),
    ])

    return NextResponse.json(track, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/tracks')
  }
}
