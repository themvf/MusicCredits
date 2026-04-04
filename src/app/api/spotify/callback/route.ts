import { auth } from '@clerk/nextjs/server'
import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  exchangeSpotifyCode,
  fetchSpotifyProfile,
  getSpotifyTokenExpiry,
  normalizeReturnTo,
} from '@/lib/spotify-api'

export const runtime = 'nodejs'

const SPOTIFY_STATE_COOKIE = 'soundswap_spotify_oauth'

function withSpotifyStatus(req: NextRequest, returnTo: string, status: 'connected' | 'error') {
  const url = new URL(returnTo, req.nextUrl.origin)
  url.searchParams.set('spotify', status)
  return url
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const spotifyError = req.nextUrl.searchParams.get('error')
  const rawStateCookie = req.cookies.get(SPOTIFY_STATE_COOKIE)?.value

  const fallbackReturnTo = '/dashboard'
  let returnTo = fallbackReturnTo

  if (!rawStateCookie || !state) {
    const response = NextResponse.redirect(
      withSpotifyStatus(req, fallbackReturnTo, 'error')
    )
    response.cookies.delete(SPOTIFY_STATE_COOKIE)
    return response
  }

  try {
    const parsed = JSON.parse(rawStateCookie) as {
      state?: string
      returnTo?: string
    }
    returnTo = normalizeReturnTo(parsed.returnTo)

    if (!parsed.state || parsed.state !== state) {
      const response = NextResponse.redirect(
        withSpotifyStatus(req, returnTo, 'error')
      )
      response.cookies.delete(SPOTIFY_STATE_COOKIE)
      return response
    }
  } catch {
    const response = NextResponse.redirect(
      withSpotifyStatus(req, fallbackReturnTo, 'error')
    )
    response.cookies.delete(SPOTIFY_STATE_COOKIE)
    return response
  }

  if (spotifyError || !code) {
    const response = NextResponse.redirect(withSpotifyStatus(req, returnTo, 'error'))
    response.cookies.delete(SPOTIFY_STATE_COOKIE)
    return response
  }

  try {
    const user = await getAuthenticatedUser()
    const tokens = await exchangeSpotifyCode(code)
    const profile = await fetchSpotifyProfile(tokens.access_token)

    if (!tokens.refresh_token) {
      throw new Error('Spotify did not return a refresh token')
    }

    const existingAccount = await prisma.spotifyAccount.findUnique({
      where: { spotifyUserId: profile.id },
    })

    if (existingAccount && existingAccount.userId !== user.id) {
      const response = NextResponse.redirect(
        withSpotifyStatus(req, returnTo, 'error')
      )
      response.cookies.delete(SPOTIFY_STATE_COOKIE)
      return response
    }

    await prisma.spotifyAccount.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        spotifyUserId: profile.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: getSpotifyTokenExpiry(tokens.expires_in),
      },
      update: {
        spotifyUserId: profile.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        expiresAt: getSpotifyTokenExpiry(tokens.expires_in),
      },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const response = NextResponse.redirect(
        withSpotifyStatus(req, returnTo, 'error')
      )
      response.cookies.delete(SPOTIFY_STATE_COOKIE)
      return response
    }

    console.error('[GET /api/spotify/callback]', error)
    const response = NextResponse.redirect(withSpotifyStatus(req, returnTo, 'error'))
    response.cookies.delete(SPOTIFY_STATE_COOKIE)
    return response
  }

  const response = NextResponse.redirect(withSpotifyStatus(req, returnTo, 'connected'))
  response.cookies.delete(SPOTIFY_STATE_COOKIE)
  return response
}
