import 'server-only'

import { prisma } from '@/lib/prisma'
import { hydrateTrackMetadataList } from '@/lib/track-metadata'

export interface EnrichedTrack {
  id: string
  spotifyUrl: string
  spotifyTrackId: string | null
  title: string
  artistName: string
  artworkUrl: string | null
  createdAt: string
  listenCount: number
  averageRating: number | null
  ratingCount: number
}

export interface HistoryEntry {
  sessionId: string
  trackId: string
  spotifyUrl: string
  spotifyTrackId: string | null
  title: string
  artistName: string
  artworkUrl: string | null
  completedAt: string
  score: number | null
}

export interface ActivityEntry {
  id: string
  type: 'submission' | 'listen'
  title: string
  description: string
  createdAt: string
}

export interface CreditTrendPoint {
  label: string
  earned: number
  spent: number
}

export async function getCreatorAnalytics(userId: string) {
  const [myTracks, completedSessions] = await Promise.all([
    prisma.track.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        sessions: {
          where: { completed: true },
          include: { rating: true },
        },
      },
    }),
    prisma.listeningSession.findMany({
      where: { userId, completed: true },
      orderBy: { startedAt: 'desc' },
      include: {
        track: {
          select: {
            id: true,
            spotifyUrl: true,
            spotifyTrackId: true,
            title: true,
            artistName: true,
            artworkUrl: true,
          },
        },
        rating: { select: { score: true } },
      },
    }),
  ])

  const hydratedTracks = await hydrateTrackMetadataList(myTracks)
  const hydratedHistoryTracks = await hydrateTrackMetadataList(
    completedSessions.map((session) => session.track)
  )
  const historyTrackById = new Map(
    hydratedHistoryTracks.map((track) => [track.id, track] as const)
  )

  const enrichedTracks: EnrichedTrack[] = hydratedTracks.map((track) => {
    const ratings = track.sessions
      .map((session) => session.rating?.score)
      .filter((score): score is number => score !== undefined)

    const averageRating =
      ratings.length > 0
        ? Math.round(
            (ratings.reduce((total, score) => total + score, 0) / ratings.length) *
              10
          ) / 10
        : null

    return {
      id: track.id,
      spotifyUrl: track.spotifyUrl,
      spotifyTrackId: track.spotifyTrackId,
      title: track.title,
      artistName: track.artistName,
      artworkUrl: track.artworkUrl,
      createdAt: track.createdAt.toISOString(),
      listenCount: track.sessions.length,
      averageRating,
      ratingCount: ratings.length,
    }
  })

  const historyEntries: HistoryEntry[] = completedSessions.map((session) => {
    const track = historyTrackById.get(session.trackId)

    return {
      sessionId: session.id,
      trackId: session.trackId,
      spotifyUrl: track?.spotifyUrl ?? session.track.spotifyUrl,
      spotifyTrackId: track?.spotifyTrackId ?? session.track.spotifyTrackId,
      title: track?.title ?? session.track.title ?? 'Spotify Track',
      artistName:
        track?.artistName ?? session.track.artistName ?? 'Unknown artist',
      artworkUrl: track?.artworkUrl ?? session.track.artworkUrl,
      completedAt: session.startedAt.toISOString(),
      score: session.rating?.score ?? null,
    }
  })

  const allRatings = enrichedTracks
    .map((track) => track.averageRating)
    .filter((rating): rating is number => rating !== null)

  const totalListens = enrichedTracks.reduce(
    (total, track) => total + track.listenCount,
    0
  )
  const tracksWithFeedback = enrichedTracks.filter((track) => track.listenCount > 0).length
  const completionRate =
    enrichedTracks.length > 0
      ? Math.round((tracksWithFeedback / enrichedTracks.length) * 100)
      : 0

  const activity: ActivityEntry[] = [
    ...myTracks.map((track) => ({
      id: `track-${track.id}`,
      type: 'submission' as const,
      title: 'Track submitted',
      description: `Spent 10 credits to queue a Spotify submission.`,
      createdAt: track.createdAt.toISOString(),
    })),
    ...completedSessions.map((session) => ({
      id: `listen-${session.id}`,
      type: 'listen' as const,
      title: 'Listening session completed',
      description: `Earned 1 credit after rating a queued track.`,
      createdAt: session.startedAt.toISOString(),
    })),
  ].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))

  const formatDay = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
  const creditsTrend: CreditTrendPoint[] = Array.from({ length: 7 }, (_, index) => {
    const day = new Date()
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - (6 - index))

    const nextDay = new Date(day)
    nextDay.setDate(day.getDate() + 1)

    const earned = completedSessions.filter(
      (session) => session.startedAt >= day && session.startedAt < nextDay
    ).length

    const spent = myTracks.filter(
      (track) => track.createdAt >= day && track.createdAt < nextDay
    ).length * 10

    return {
      label: formatDay.format(day),
      earned,
      spent,
    }
  })

  return {
    myTracks,
    completedSessions,
    enrichedTracks,
    historyEntries,
    activity,
    summary: {
      creditsEarned: completedSessions.length,
      creditsSpent: myTracks.length * 10,
      totalListens,
      completionRate,
      averageRating:
        allRatings.length > 0
          ? (
              allRatings.reduce((total, rating) => total + rating, 0) /
              allRatings.length
            ).toFixed(1)
          : '0.0',
      tracksSubmitted: enrichedTracks.length,
      sessionsCompleted: completedSessions.length,
    },
    creditsTrend,
  }
}
