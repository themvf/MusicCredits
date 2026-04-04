import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { buildSpotifyAuthorizeUrl, normalizeReturnTo } from '@/lib/spotify-api'

export const runtime = 'nodejs'

const SPOTIFY_STATE_COOKIE = 'soundswap_spotify_oauth'

export async function GET(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  const returnTo = normalizeReturnTo(req.nextUrl.searchParams.get('returnTo'))
  const state = crypto.randomUUID()
  const response = NextResponse.redirect(buildSpotifyAuthorizeUrl(state))

  response.cookies.set(
    SPOTIFY_STATE_COOKIE,
    JSON.stringify({ state, returnTo }),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 10,
    }
  )

  return response
}
