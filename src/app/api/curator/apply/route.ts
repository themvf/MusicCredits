import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleApiError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fetchPlaylistForCuratorApplication } from '@/lib/spotify-api'
import { GENRES } from '@/lib/genres'
import { clerkClient } from '@clerk/nextjs/server'

export const runtime = 'nodejs'

const MANUAL_REJECTION_COOLDOWN_DAYS = 30

const applySchema = z.object({
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
  motivation: z
    .string()
    .min(10, 'Tell us a bit more (minimum 10 characters)')
    .max(150, 'Keep it under 150 characters'),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    // Admins cannot apply to be curators
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Admin accounts cannot apply as curators' },
        { status: 403 }
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

    const { spotifyPlaylistUrl, genres, motivation } = parsed.data

    // Block if there's already a pending application
    const existingPending = await prisma.curatorApplication.findFirst({
      where: { userId: user.id, status: 'pending' },
    })
    if (existingPending) {
      return NextResponse.json(
        { error: 'You already have a pending application under review' },
        { status: 409 }
      )
    }

    // Block if there's already an approved application (already a curator)
    if (user.role === 'both') {
      return NextResponse.json(
        { error: 'You are already an approved curator' },
        { status: 409 }
      )
    }

    // Check 30-day cooldown on manual rejections
    const latestRejection = await prisma.curatorApplication.findFirst({
      where: { userId: user.id, status: 'rejected' },
      orderBy: { updatedAt: 'desc' },
    })
    if (latestRejection && latestRejection.reviewedBy) {
      // Manual rejection — check cooldown
      const cooldownEnd = new Date(latestRejection.updatedAt)
      cooldownEnd.setDate(cooldownEnd.getDate() + MANUAL_REJECTION_COOLDOWN_DAYS)
      if (new Date() < cooldownEnd) {
        const daysLeft = Math.ceil(
          (cooldownEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        return NextResponse.json(
          {
            error: `You can reapply in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
            cooldownDaysLeft: daysLeft,
          },
          { status: 429 }
        )
      }
    }

    // ─── Spotify playlist check ───────────────────────────────────────────────

    const playlistData = await fetchPlaylistForCuratorApplication(spotifyPlaylistUrl)

    if (!playlistData) {
      // Private or inaccessible playlist
      return NextResponse.json(
        {
          error:
            "We couldn't access that playlist. Make sure it's set to public on Spotify.",
          spotifyCheckStatus: 'failed_private',
        },
        { status: 422 }
      )
    }

    // Read the minimum follower threshold from platform_settings
    const thresholdSetting = await prisma.platformSetting.findUnique({
      where: { key: 'curator_min_followers' },
    })
    const minFollowers = parseInt(thresholdSetting?.value ?? '500', 10)

    const thresholdMet = playlistData.followerCount >= minFollowers
    const spotifyCheckStatus = thresholdMet ? 'passed' : 'failed_threshold'

    // Auto-reject if below threshold — no admin involvement needed
    if (!thresholdMet) {
      await prisma.curatorApplication.create({
        data: {
          userId: user.id,
          spotifyPlaylistId: playlistData.playlistId,
          playlistName: playlistData.playlistName,
          followerCountAtApply: playlistData.followerCount,
          thresholdMet: false,
          spotifyCheckStatus: 'failed_threshold',
          genres,
          motivation,
          status: 'rejected',
          rejectionReason: `Your playlist has ${playlistData.followerCount.toLocaleString()} followers. The minimum is ${minFollowers.toLocaleString()}.`,
        },
      })
      return NextResponse.json(
        {
          error: `Your playlist has ${playlistData.followerCount.toLocaleString()} followers. The minimum is ${minFollowers.toLocaleString()}. Come back when you've grown your audience.`,
          spotifyCheckStatus: 'failed_threshold',
          followerCount: playlistData.followerCount,
          minFollowers,
        },
        { status: 422 }
      )
    }

    // ─── Passed threshold — create pending application ────────────────────────

    // Store Clerk display name in ArtistProfile so admin can identify applicants
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
          spotifyPlaylistId: playlistData.playlistId,
          playlistName: playlistData.playlistName,
          followerCountAtApply: playlistData.followerCount,
          thresholdMet: true,
          spotifyCheckStatus: 'passed',
          genres,
          motivation,
          status: 'pending',
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
