import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api-error'
import { searchSpotifyArtists } from '@/lib/spotify-api'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim()
    if (!q || q.length < 1) {
      return NextResponse.json([])
    }
    const results = await searchSpotifyArtists(q)
    return NextResponse.json(results)
  } catch (error) {
    return handleApiError(error, 'GET /api/spotify/artist-search')
  }
}
