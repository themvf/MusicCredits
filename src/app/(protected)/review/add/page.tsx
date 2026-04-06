import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { findMatchingCuratorPlaylists } from '@/lib/curator-matching'
import CuratorAddClient from '@/components/CuratorAddClient'

export default async function ReviewAddPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string; trackId?: string; credits?: string }>
}) {
  const user = await getAuthenticatedUser()
  const { sessionId, trackId, credits } = await searchParams

  if (user.role !== 'both') redirect('/dashboard')

  if (!sessionId || !trackId) redirect('/review')

  // Validate the session belongs to this user and was just completed with playlistAdded=true
  const session = await prisma.listeningSession.findUnique({
    where: { id: sessionId },
    select: { userId: true, completed: true, playlistAdded: true, trackId: true },
  })

  if (!session || session.userId !== user.id) redirect('/review')
  if (!session.completed || !session.playlistAdded) redirect('/review')
  if (session.trackId !== trackId) redirect('/review')

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: { id: true, title: true, artistName: true, spotifyUrl: true, artworkUrl: true, genres: true },
  })

  if (!track) redirect('/review')

  // Only show playlists whose genres overlap with the track
  const matchingPlaylists = await findMatchingCuratorPlaylists(user.id, track.genres)

  return (
    <CuratorAddClient
      track={{
        id: track.id,
        title: track.title ?? 'Unknown title',
        artistName: track.artistName ?? 'Unknown artist',
        spotifyUrl: track.spotifyUrl,
        artworkUrl: track.artworkUrl,
      }}
      playlists={matchingPlaylists.map((p) => ({
        id: p.id,
        name: p.playlistName,
        spotifyPlaylistId: p.spotifyPlaylistId,
        genres: p.genres,
        followers: p.followers,
      }))}
      credits={credits ? parseInt(credits, 10) : null}
    />
  )
}
