import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api-error'
import { fetchSpotifyTrackPreview } from '@/lib/spotify-api'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id || !/^[A-Za-z0-9]{22}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid track ID' }, { status: 400 })
    }
    const preview = await fetchSpotifyTrackPreview(id)
    return NextResponse.json(preview)
  } catch (error) {
    return handleApiError(error, 'GET /api/spotify/track')
  }
}
