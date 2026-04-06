import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleApiError, ApiRouteError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fetchPlaylistForCuratorApplication } from '@/lib/spotify-api'
import { GENRES } from '@/lib/genres'
import { clerkClient } from '@clerk/nextjs/server'

export const runtime = 'nodejs'

const MAX_PLAYLISTS = 10

const playlistEntrySchema = z.object({
  spotifyPlaylistUrl: z
    .string()
    .regex(
      /^https:\/\/open\.spotify\.com\/playlist\/[A-Za-z0-9]{22}/,
      'Must be a valid Spotify playlist URL'
    ),
  genres: z
    .array(z.enum(GENRES as unknown as [string, ...string[]]))
    .min(1, 'Select at least one genre')
    .max(2, 'Select up to 2 genres'),
})

const applySchema = z.object({
  playlists: z
    .array(playlistEntrySchema)
    .min(1, 'Add at least one playlist')
    .max(MAX_PLAYLISTS, `Maximum ${MAX_PLAYLISTS} playlists`),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Admin accounts cannot apply as curators' },
        { status: 403 }
      )
    }

    if (user.role === 'both') {
      return NextResponse.json({ error: 'You are already an approved curator' }, { status: 409 })
    }

    // Require Spotify to be connected (ownership check depends on it)
    const spotifyAccount = await prisma.spotifyAccount.findUnique({
      where: { userId: user.id },
    })
    if (!spotifyAccount) {
      return NextResponse.json(
        { error: 'Connect Spotify before applying' },
        { status: 422 }
      )
    }

    // Block if pending application exists
    const existingPending = await prisma.curatorApplication.findFirst({
      where: { userId: user.id, status: 'pending' },
    })
    if (existingPending) {
      return NextResponse.json(
        { error: 'You already have a pending application under review' },
        { status: 409 }
      )
    }

    const body = await req.json()
    const parsed = applySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { playlists } = parsed.data

    // Read follower threshold
    const thresholdSetting = await prisma.platformSetting.findUnique({
      where: { key: 'curator_min_followers' },
    })
    const minFollowers = parseInt(thresholdSetting?.value ?? '500', 10)

    // ─── Per-playlist checks ──────────────────────────────────────────────────
    const playlistResults = await Promise.all(
      playlists.map(async (entry) => {
        const data = await fetchPlaylistForCuratorApplication(entry.spotifyPlaylistUrl)

        if (!data) {
          return {
            url: entry.spotifyPlaylistUrl,
            genres: entry.genres,
            spotifyCheckStatus: 'failed_private' as const,
            error: "We couldn't access that playlist. Make sure it's set to public on Spotify.",
          }
        }

        // Ownership check: owner OR collaborative playlist
        const isOwner = data.ownerId === spotifyAccount.spotifyUserId
        const isCollaborative = data.collaborative
        if (!isOwner && !isCollaborative) {
          return {
            url: entry.spotifyPlaylistUrl,
            genres: entry.genres,
            playlistId: data.playlistId,
            playlistName: data.playlistName,
            followerCount: data.followerCount,
            spotifyCheckStatus: 'failed_ownership' as const,
            error: `This playlist does not belong to you. Please choose a different playlist.`,
          }
        }

        const thresholdMet = data.followerCount >= minFollowers
        if (!thresholdMet) {
          return {
            url: entry.spotifyPlaylistUrl,
            genres: entry.genres,
            playlistId: data.playlistId,
            playlistName: data.playlistName,
            followerCount: data.followerCount,
            spotifyCheckStatus: 'failed_threshold' as const,
            error: `Your playlist "${data.playlistName}" has ${data.followerCount.toLocaleString()} followers. The minimum is ${minFollowers.toLocaleString()}.`,
          }
        }

        return {
          url: entry.spotifyPlaylistUrl,
          genres: entry.genres,
          playlistId: data.playlistId,
          playlistName: data.playlistName,
          followerCount: data.followerCount,
          spotifyCheckStatus: 'passed' as const,
          error: null,
        }
      })
    )

    const passing = playlistResults.filter((r) => r.spotifyCheckStatus === 'passed')
    const failing = playlistResults.filter((r) => r.spotifyCheckStatus !== 'passed')

    // Return per-playlist errors to client if any failed — don't create application yet
    if (failing.length > 0) {
      return NextResponse.json(
        {
          error: 'Some playlists could not be verified. Fix the issues and try again.',
          playlistErrors: playlistResults.map((r) => ({
            url: r.url,
            status: r.spotifyCheckStatus,
            error: r.error,
          })),
        },
        { status: 422 }
      )
    }

    // All passed — create application + playlist rows in one transaction
    const clerk = await clerkClient()
    const clerkUser = await clerk.users.getUser(user.clerkId)
    const displayName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
      clerkUser.username ||
      null

    await prisma.$transaction([
      prisma.curatorApplication.create({
        data: {
          userId: user.id,
          status: 'pending',
          playlists: {
            create: passing.map((p) => ({
              spotifyPlaylistId: p.playlistId!,
              playlistName: p.playlistName!,
              followerCountAtApply: p.followerCount!,
              thresholdMet: true,
              spotifyCheckStatus: 'passed',
              genres: p.genres,
            })),
          },
        },
      }),
      prisma.artistProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, displayName },
        update: displayName ? { displayName } : {},
      }),
    ])

    return NextResponse.json({ status: 'pending' }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/curator/apply')
  }
}
