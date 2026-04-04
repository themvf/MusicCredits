import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api-error'
import { getAuthenticatedUser } from '@/lib/auth'
import { syncSpotifyPlaylistsForUser } from '@/lib/spotify-api'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    const playlists = await syncSpotifyPlaylistsForUser(user.id)

    return NextResponse.json({ playlists })
  } catch (error) {
    return handleApiError(error, 'GET /api/spotify/playlists')
  }
}
